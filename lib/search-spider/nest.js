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
const objectHash = require('object-hash')
const ProgressBar = require('progress')
const stripJsonComments = require('strip-json-comments')

const OnDemandMediaLoader = require('./on-demand-media-loader')
const SpiderConductor = require('./conductor')

// SpiderNest coordinates a collection of configured web spiders and executes their tasks with reasonable concurrency
class SpiderNest {
  constructor (settings) {
    this.settings = settings
    this.loaded = false
    this.timestamps = {}
    this.buildTimestampsFile = `${this.settings.spiderPath}/frozen-data/build-timestamps.cbor`
    this.writeQueue = new PQueue({ concurrency: 1 })
    this.content = {}
  }

  log (...text) {
    const opts = { breakLength: Infinity }
    const message = text.map(x => typeof x === 'string' ? x : util.inspect(x, opts)).join(', ')
    const messageColor = text.map(x => typeof x === 'string' ? x : util.inspect(x, { ...opts, colors: true })).join(' ')
    if (this.stderrWriter) {
      this.stderrWriter(messageColor)
    } else {
      console.error(messageColor)
    }

    this.writeQueue.add(() =>
      fs.appendFile(`${this.settings.logsPath}/build.txt`, `${Date.now()}: ${message}\n`)
    )
  }

  // load data and lock timestamps file to signify the spider is running
  async load () {
    if (this.loaded) return
    this.configs = JSON.parse(stripJsonComments((await fs.readFile(`${this.settings.spiderPath}/configs.json`)).toString()))
    this.vectorDB = await (new VectorLibrary({
      path: this.settings.vectorDBPath,
      fs,
      digest: async (algo, data) => {
        const hash = crypto.createHash(algo)
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
        this.timestamps = Object.fromEntries(Object.entries(this.timestamps).filter(([key, value]) => !!this.configs[key]))
      } catch (err) {
        this.log(`build-timestamps.cbor is corrupt? ignoring. Error: ${err}`)
      }
      this.log(' -----------  ----------- New Build Starting ----------- ----------- ')
    }

    // create SpiderConductors
    this.spiders = {}
    for (const spiderName in this.configs) {
      this.spiders[spiderName] = new SpiderConductor(this, spiderName, this.configs[spiderName])
      await this.spiders[spiderName].start()
    }

    this.loaded = true
  }

  // unlock timestamps file so another spider instance can run
  async unload () {
    if (this.buildTimestampsLock) {
      await this.buildTimestampsLock()
      this.buildTimestampsLock = null
    }
  }

  // runs all configured spiders, refreshing any content older than maxAgeString
  async runInSeries (maxAgeString) {
    // store current timestamp to time scrape step
    const startTime = Date.now()
    // iterate through configured sources
    for (const source of Object.keys(this.configs)) {
      // calculate how long ago we last spidered this source
      const sourceAge = startTime - (this.timestamps[source] || 0)
      // parse out how often the source should execute
      const sourceInterval = parseDuration(this.spiders[source].config.interval || '0')
      // spider it again if it's been longer than the configured spider interval, with 5 seconds extra wiggle room
      if (sourceAge >= (sourceInterval - 5000)) {
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

  async runOneSpider (source, maxAgeString = false) {
    const maxAge = parseDuration(maxAgeString || this.spiders[source].config.expires || '1 year')

    await this.spiders[source].run(maxAge)
  }

  async buildDatasets (force = false) {
    const content = await Promise.all(Object.values(this.spiders).map(x => x.getContent()))
    const contentLength = content.reduce((prev, curr) => prev + Object.keys(curr).length, 0)

    // setup library
    const buildIDs = await Promise.all(Object.values(this.spiders).map(x => x.buildID()))
    const buildID = objectHash(buildIDs.sort(), { algorithm: 'sha256' }).slice(0, 16)
    if (await fs.pathExists(`${this.settings.datasetsPath}/${this.settings.libraryName}/definitions/${buildID}`) && !force) {
      this.log('Dataset already exists in current form, skipping build')
      return false
    }
    const library = await this.getSearchLibraryWriter({
      name: this.settings.libraryName, buildID, contentLength
    })

    // load the existing update log
    let updateLog = []
    const updateLogPath = `${this.settings.datasetsPath}/update-log.cbor`
    if (await fs.pathExists(updateLogPath)) {
      updateLog = cbor.decodeAll(await fs.readFile(updateLogPath))
    }

    // scan through updateLog and mark all entries as unavilable, they'll be corrected in the next step
    // if they're still online. Resources that get taken down can be hidden from the homepage feed this way.
    for (const entry of updateLog) {
      entry.available = false
    }

    // setup the progress bar if the terminal supports that stuff (don't do it if our output is being piped to a log file or something like that)
    if (process.stdout.clearLine) {
      var progress = new ProgressBar(' [:bar] :rate/ips :percent :etas :spiderName :entryID', {
        total: contentLength, width: 80, head: '>', incomplete: ' ', clear: true
      })
      // override the default console logging to route through the progress bar
      this.stderrWriter = text => progress.interrupt(text)
    }

    for (const spiderName in this.spiders) {
      const spider = this.spiders[spiderName]
      const spiderContent = await spider.getContent()

      // create a place to store a global collectection of reference counted source videos, to avoid downloading
      // multiple times when clipping multiple videos out of one source video
      const sourceVideoCache = {}

      // loop through accumulated content, writing it in to the searchLibrary and fetching any media necessary
      for (const entryID in spiderContent) {
        const entry = spiderContent[entryID]

        // update the progress bar
        if (progress) {
          progress.tick({ spiderName, entryID })
        } else {
          console.error(`Importing ${spiderName}:${entryID}...`)
        }

        // check if an override file exists
        let overrideObject = {}
        if (this.settings.overridesPath) {
          const overridePath = `${this.settings.overridesPath}/${spiderName}:${entryID}.json`
          if (await fs.pathExists(overridePath)) {
            this.log(`Implementing override data from ${overridePath}`)
            overrideObject = JSON.parse(await fs.readFile(overridePath))
          }
        }

        // write the definition - pulling and encoding any media necessary
        const definition = {
          title: entry.title || entry.words.join(', '),
          keywords: entry.words,
          tags: [...(spider.config.tags || []), ...(entry.tags || [])].filter((v, i, a) => a.indexOf(v) === i).map(x => `${x}`.toLowerCase()),
          link: entry.link,
          nav: entry.nav,
          body: entry.body,
          media: entry.videos.map(videoInfo => new OnDemandMediaLoader({ spider: spider.spider, sourceVideoCache, spiderName, videoInfo, log: (...a) => this.log(...a) })),
          provider: spiderName,
          timestamp: entry.timestamp || 0,
          discoveryVerb: entry.discoveryVerb || spider.config.discoveryVerb,
          id: entryID,
          ...overrideObject
        }
        await library.addDefinition(definition)

        // update data in the update log
        const logEntry = {
          provider: spiderName,
          providerLink: spider.config.link,
          id: definition.id,
          link: definition.link,
          words: [(definition.title || definition.keywords)].flat(),
          verb: definition.discoveryVerb,
          timestamp: definition.timestamp,
          body: definition.body,
          available: true
        }

        const link = entry.link.toString()
        const existingEntry = updateLog.find(x => x.link === link)
        // if an existing entry exists, update it's values to the current version of the scrape
        if (existingEntry) {
          Object.entries(logEntry).forEach(([k, v]) => {
            existingEntry[k] = v
          })
        } else {
          this.log(`New: ${entry.link} - ${entry.words}`)
          updateLog.push(logEntry)
        }
      }

      // cleanup source videos
      await Promise.all(Object.values(sourceVideoCache).map(path => fs.remove(path)))
    }
    // disable the progress bar override for console logging
    if (progress) {
      delete this.stderrWriter
    }

    const previousBuildID = (await fs.readFile(`${this.settings.datasetsPath}/${this.settings.libraryName}/buildID.txt`)).toString()

    // save the dataset out to the filesystem from memory
    await library.save()
    // cleanup any unreferenced/unused files in the dataset, except the last dataset, in case a user is still loading it
    await library.cleanup([previousBuildID])

    // sort the update log by timestamp, most recent at the end
    updateLog = updateLog.sort((a, b) => a.timestamp - b.timestamp)

    // write out logs
    await Promise.all([
      fs.writeFile(updateLogPath, Buffer.concat(updateLog.map(x => cbor.encode(x)))),
      fs.writeFile(`${this.nest.settings.datasetsPath}/update-log.txt`,
        updateLog.filter(entry => entry.available !== false).map(entry => {
          return `${entry.provider} ${entry.verb} [${entry.words.join(', ')}](${entry.link}) (timestamp: ${entry.timestamp})\n`
        }).join('')
      )
    ])

    this.log(`Dataset rebuild complete! New version buildID is "${buildID}"`)

    return true
  }

  // creates a SearchLibraryWriter for the SpiderConductor to use to do a build
  async getSearchLibraryWriter ({ name, buildID, contentLength }) {
    // build search library
    const libraryPath = `${this.settings.datasetsPath}/${name}`
    await fs.ensureDir(libraryPath)

    // calculate how many shardBits are needed to make each json definition block be about 15kb big
    let shardBits = 1
    while (contentLength / 30 > 2 ** shardBits) shardBits += 1
    // create a SearchLibraryWriter with reasonable values
    const searchLibrary = new SearchLibrary({
      path: libraryPath,
      vectorBits: 8,
      vectorLibrary: this.vectorDB,
      buildID,
      cleanupKeywords: true,
      ...this.settings.searchLibraryParams,
      // modify the mediaFormats to include an overridden log function, that routes logging back in to
      // nest's logger so things get written to console and logs/build.txt correctly (avoid progress bar interference)
      mediaFormats: (this.settings.searchLibraryParams.mediaFormats || []).map(mediaFormat => {
        const modded = Object.create(mediaFormat)
        modded.log = (...args) => this.log(...args)
        return modded
      }),
      mediaCache: new MediaCache({ path: libraryPath, log: (...args) => this.log(...args) }),
      log: (...args) => this.log(...args)
    })

    return searchLibrary
  }
}

module.exports = SpiderNest
