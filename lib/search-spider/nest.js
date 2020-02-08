const fs = require('fs-extra')
const cbor = require('borc')
const crypto = require('crypto')
const util = require('util')

const VectorLibrary = require('../vector-library/library')
const SearchLibrary = require('../search-library/library-node')
const MediaCache = require('../search-library/media-cache')
const englishTextFilter = require('../vector-library/text-filter-english')

const PQueue = require('p-queue').default
const parseDuration = require('parse-duration')
const prettyMs = require('pretty-ms')
const lockfile = require('proper-lockfile')
const Feed = require('feed').Feed
const html = require('nanohtml')
const objectHash = require('object-hash')
const dateFNS = require('date-fns')
const ProgressBar = require('progress')
const stripJsonComments = require('strip-json-comments')

const OnDemandMediaLoader = require('./on-demand-media-loader')
const SpiderConductor = require('./conductor')

// SpiderNest coordinates a collection of configured web spiders and executes their tasks with reasonable concurrency
class SpiderNest {
  constructor(settings) {
    this.settings = settings
    this.loaded = false
    this.timestamps = {}
    this.buildTimestampsFile = `${this.settings.spiderPath}/frozen-data/build-timestamps.cbor`
    this.writeQueue = new PQueue({ concurrency: 1 })
    this.content = {}
  }

  log(...text) {
    let opts = { breakLength: Infinity }
    let message = text.map(x => typeof(x) == 'string' ? x : util.inspect(x, opts)).join(', ')
    let messageColor = text.map(x => typeof(x) == 'string' ? x : util.inspect(x, {...opts, colors: true})).join(' ')
    if (this.stderrWriter) this.stderrWriter(messageColor)
    else console.error(messageColor)
    this.writeQueue.add(()=> fs.appendFile(`${this.settings.logsPath}/build.txt`, `${Date.now()}: ${message}\n`) )
  }

  // load data and lock timestamps file to signify the spider is running
  async load() {
    if (this.loaded) return
    this.configs = JSON.parse(stripJsonComments((await fs.readFile(`${this.settings.spiderPath}/configs.json`)).toString()))
    this.vectorDB = await (new VectorLibrary({
      path: this.settings.vectorDBPath,
      fs, digest: async (algo, data)=> {
        let hash = crypto.createHash(algo)
        hash.update(data)
        return new Uint8Array(hash.digest())
      },
      textFilter: englishTextFilter
    })).open()

    await fs.ensureDir(this.settings.logsPath)
    
    if (await fs.pathExists(this.buildTimestampsFile)) {
      this.buildTimestampsLock = await lockfile.lock(this.buildTimestampsFile)
      try {
        this.timestamps = cbor.decode(await fs.readFile(this.buildTimestampsFile))
        // remove any timestamps for spiders that aren't configured anymore
        this.timestamps = Object.fromEntries(Object.entries(this.timestamps).filter(([key, value])=> !!this.configs[key] ))

      } catch (err) { this.log(`build-timestamps.cbor is corrupt? ignoring. Error: ${err}`) }
      this.log(" -----------  ----------- New Build Starting ----------- ----------- ")
    }

    // create SpiderConductors
    this.spiders = {}
    for (let spiderName in this.configs) {
      this.spiders[spiderName] = new SpiderConductor(this, spiderName, this.configs[spiderName])
      await this.spiders[spiderName].start()
    }

    this.loaded = true
  }

  // unlock timestamps file so another spider instance can run
  async unload() {
    if (this.buildTimestampsLock) {
      await this.buildTimestampsLock()
      this.buildTimestampsLock = null
    }
  }

  // runs all configured spiders, refreshing any content older than maxAgeString
  async runInSeries(maxAgeString) {
    // store current timestamp to time scrape step
    let startTime = Date.now()
    // iterate through configured sources
    for (let source of Object.keys(this.configs)) {
      // calculate how long ago we last spidered this source
      let sourceAge = startTime - this.timestamps[source]
      // parse out how often the source should execute
      let sourceInterval = parseDuration(this.spiders[source].config.interval || "0")
      // spider it again if it's been longer than the configured spider interval
      if (sourceAge >= sourceInterval) {
        // update timestamps file
        this.timestamps[source] = startTime
        await fs.writeFile(this.buildTimestampsFile, cbor.encode(this.timestamps))

        // run necessary spider tasks
        await this.runOneSpider(source, maxAgeString)
      } else {
        this.log(`Skipping ${source} as it is not due to run for another ${prettyMs(sourceInterval - sourceAge)}`)
      }
    }
    this.log(`Finished spidering in ${prettyMs(Date.now() - startTime)}`)
  }

  async runOneSpider(source, maxAgeString = false) {
    let maxAge = parseDuration(maxAgeString || this.spiders[source].config.expires || "1 year")

    await this.spiders[source].run(maxAge)
  }

  async buildDatasets() {
    let content = await Promise.all(Object.values(this.spiders).map(x => x.getContent()))
    let contentLength = content.reduce((prev, curr) => prev + Object.keys(curr).length, 0)

    // setup library
    let buildIDs = await Promise.all(Object.values(this.spiders).map(x => x.buildID()))
    let buildID = objectHash(buildIDs.sort(), { algorithm: 'sha256' }).slice(0, 16)
    if (await fs.pathExists(`${this.settings.datasetsPath}/${this.settings.libraryName}/definitions/${buildID}`)) {
      this.log(`Dataset already exists in current form, skipping build`)
      return false
    }
    let library = await this.getSearchLibraryWriter({
      name: this.settings.libraryName, buildID, contentLength
    })
    
    var progress = new ProgressBar(' [:bar] :rate/ips :percent :etas :spiderName :entryID', {
      total: contentLength, width: 80, head: '>', incomplete: ' ', clear: true
    })
    // override the default console logging to route through the progress bar
    this.stderrWriter = (text)=> progress.interrupt(text)
    for (let spiderName in this.spiders) {
      let spider = this.spiders[spiderName]
      let spiderContent = await spider.getContent()

      // create a place to store a global collectection of reference counted source videos, to avoid downloading
      // multiple times when clipping multiple videos out of one source video
      let sourceVideoCache = {}

      // loop through accumulated content, writing it in to the searchLibrary and fetching any media necessary
      for (let entryID in spiderContent) {
        let entry = spiderContent[entryID]
        //this.log(`Importing ${spiderName} ${entry.link}: ${entry.title || entry.words.join(', ')}`)

        // check if an override file exists
        let overrideObject = {}
        if (this.settings.overridesPath) {
          let overridePath = `${this.settings.overridesPath}/${spiderName}:${entryID}.json`
          if (await fs.pathExists(overridePath)) {
            this.log(`Implementing override data from ${overridePath}`)
            overrideObject = JSON.parse(await fs.readFile(overridePath))
          }
        }

        await library.addDefinition(Object.assign({
          title: entry.title || entry.words.join(', '),
          keywords: entry.words,
          tags: [...(spider.config.tags || []), ...(entry.tags || [])].filter((v,i,a) => a.indexOf(v) === i).map(x => `${x}`.toLowerCase()),
          link: entry.link,
          body: entry.body,
          media: entry.videos.map(videoInfo => new OnDemandMediaLoader({ spider: spider.spider, sourceVideoCache, spiderName, videoInfo, log: this.log })),
          provider: spiderName,
          id: entryID
        }, overrideObject))
        progress.tick({ spiderName, entryID })
      }

      // cleanup source videos
      await Promise.all(Object.values(sourceVideoCache).map(path => fs.remove(path) ))
    }
    // disable the progress bar override for console logging
    delete this.stderrWriter

    let previousBuildID = (await fs.readFile(`${this.settings.datasetsPath}/${this.settings.libraryName}/buildID.txt`)).toString()

    // save the dataset out to the filesystem from memory
    await library.save()
    // cleanup any unreferenced/unused files in the dataset, except the last dataset, in case a user is still loading it
    await library.cleanup([previousBuildID])
    
    this.log(`Dataset rebuild complete! New version buildID is "${buildID}"`)

    return true
  }

  // creates a SearchLibraryWriter for the SpiderConductor to use to do a build
  async getSearchLibraryWriter({ name, buildID, contentLength }) {
    // build search library
    let libraryPath = `${this.settings.datasetsPath}/${name}`
    await fs.ensureDir(libraryPath)

    // calculate how many shardBits are needed to make each json definition block be about 15kb big
    let shardBits = 1
    while (contentLength / 30 > 2 ** shardBits) shardBits += 1
    // create a SearchLibraryWriter with reasonable values
    let searchLibrary = new SearchLibrary({
      path: libraryPath, vectorBits: 8, vectorLibrary: this.vectorDB, buildID, cleanupKeywords: true,
      ...this.settings.searchLibraryParams,
      mediaCache: new MediaCache({ path: libraryPath, log: (...args)=> this.log(...args) }),
      log: (...args)=> this.log(...args),
    })

    return searchLibrary
  }
}

module.exports = SpiderNest