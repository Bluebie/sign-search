const fs = require('fs-extra')
const util = require('util')
const cbor = require('borc')
const VectorLibraryReader = require('../lib/vector-library/reader')
const SearchLibraryWriter = require('../lib/search-library/writer')
const PQueue = require('p-queue').default
const parseDuration = require('parse-duration')
const prettyMs = require('pretty-ms')
const lockfile = require('proper-lockfile')
const Feed = require('feed').Feed
const html = require('nanohtml')
const objectHash = require('object-hash')
const dateFNS = require('date-fns')
const createTorrent = util.promisify(require('create-torrent'))
const ProgressBar = require('progress')
const stripJsonComments = require('strip-json-comments')

class OnDemandMediaLoader {
  constructor({spider, spiderName, sourceVideoCache, videoInfo, log}) {
    this.spider = spider
    this.spiderName = spiderName
    this.info = videoInfo
    this.log = log
    this.cache = sourceVideoCache // an object, whose values are paths to delete after import is finished
    if (this.info.clipping) this.clipping = this.info.clipping
  }

  // get a unique key that should change if the video's content changes
  async getKey() {
    return objectHash([this.spiderName, this.info], { algorithm: 'sha256' })
  }

  // gets a hash without including clipping data, for source video identification
  getSourceVideoHash() {
    let info = JSON.parse(JSON.stringify(this.info))
    info.clipping = false
    return objectHash([this.spiderName, info], { algorithm: 'sha256' })
  }

  // get path to video file - if no path exists, 
  async getVideoPath() {
    let hash = this.getSourceVideoHash()
    if (this.cache[hash]) {
      return this.cache[hash]
    } else {
      try {
        this.cache[hash] = await this.spider.fetch(this.info)
      } catch (e) {
        this.log(`Error: ${e}:`)
        this.log(`Trying again...`)
        this.cache[hash] = await this.spider.fetch(this.info)
      }
      return this.cache[hash]
    }
  }

  // once it's imported completely, we can remove the file we downloaded temporarily
  async releaseVideoPath() {
    // we'll handle this later via cleanupJobs object
  }
}




// SpiderNest coordinates a collection of configured web spiders and executes their tasks with reasonable concurrency
class SpiderNest {
  constructor(settings) {
    this.settings = settings
    this.loaded = false
    this.timestamps = {}
    this.buildTimestampsFile = `${this.settings.spiderPath}/frozen-data/build-timestamps.cbor`
    this.writeQueue = new PQueue({ concurrency: 1 })
    this.content = {}
    this.log = (...args)=> console.log(...args)
  }

  // load data and lock timestamps file to signify the spider is running
  async load() {
    if (this.loaded) return
    this.configs = JSON.parse(stripJsonComments((await fs.readFile(`${this.settings.spiderPath}/configs.json`)).toString()))
    this.vectorDB = new VectorLibraryReader()
    await this.vectorDB.open(this.settings.vectorDBPath)
    await fs.ensureDir(this.settings.logsPath)
    
    if (await fs.pathExists(this.buildTimestampsFile)) {
      this.buildTimestampsLock = await lockfile.lock(this.buildTimestampsFile, { stale: 1000 * 60 * 8 })
      try {
        this.timestamps = cbor.decode(await fs.readFile(this.buildTimestampsFile))
      } catch (err) { console.log(`build-timestamps.cbor is corrupt? ignoring. Error: ${err}`) }
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

  // run the spiders in series, easier for debugging
  async runInSeries(force = false) {
    for (let source of Object.keys(this.configs)) {
      await this.runOneSpider(source, force)
    }
  }

  // run all the spiders at the same time concurrently
  async run(force = false) {
    await Promise.all(Object.keys(this.configs).map(source => this.runOneSpider(source, force)))
  }

  // run a specific spider's named config from the spiders.json file
  // optional force argument, if true, causes scrape and build to happen regardless of expiry settings
  // returns true if the index was rebuilt, or false if not
  async runOneSpider(datasetName, force = false) {
    // check config exists
    if (!this.spiders[datasetName]) {
      throw new Error(`No spider config named ${datasetName} exists`)
    }
    
    // check if this dataset is still up to date, and maybe skip spidering it
    if (!force && !await this.checkOutdated(datasetName)) {
      return
    }

    // log out build timestamps to file for future expiry checking
    this.timestamps[datasetName] = Date.now()
    await fs.writeFile(`${this.settings.spiderPath}/frozen-data/build-timestamps.cbor`, cbor.encode(this.timestamps))

    // ask SpiderConductor to run a scrape
    await this.spiders[datasetName].run()
  }

  async buildDatasets() {
    let library
    let commonLibraryMode = !!this.settings.libraryName
    let content = await Promise.all(Object.values(this.spiders).map(x => x.getContent()))
    let contentLength = content.reduce((prev, curr) => prev + Object.keys(curr).length, 0)
    let didRebuild
    // if building a common library, set up the library
    if (commonLibraryMode) {
      let buildIDs = await Promise.all(Object.values(this.spiders).map(x => x.buildID()))
      library = await this.getSearchLibraryWriter({
        name: this.settings.libraryName,
        buildID: objectHash(buildIDs.sort(), { algorithm: 'sha256' }),
        contentLength
      })
    }
    var progress = new ProgressBar(' [:bar] :rate/ips :percent :etas :spiderName :entryID', {
      total: contentLength, width: 80, head: '>', incomplete: ' ', clear: true
    })
    let oldLog = this.log
    this.log = (...args)=> progress.interrupt(args.join(' '))
    for (let spiderName in this.spiders) {
      let spider = this.spiders[spiderName]
      let spiderContent = await spider.getContent()
      if (!commonLibraryMode) {
        library = await this.getSearchLibraryWriter({
          name: spiderName, buildID: await spider.buildID(), contentLength: Object.keys(spiderContent).length
        })
      }

      // skip import if import isn't required
      if (library.skipBuild) {
        continue
      } else {
        didRebuild = true
      }

      // create a place to store a global collectection of reference counted source videos, to avoid downloading
      // multiple times when clipping multiple videos out of one source video
      let sourceVideoCache = {}

      // loop through accumulated content, writing it in to the searchLibrary and fetching any media necessary
      for (let entryID in spiderContent) {
        let entry = spiderContent[entryID]
        this.log(`Importing ${spiderName} ${entry.link}: ${entry.title || entry.words.join(', ')}`)
        await library.append({
          words: entry.words,
          tags: [...(spider.config.tags || []), ...(entry.tags || [])].filter((v,i,a) => a.indexOf(v) === i).map(x => `${x}`.toLowerCase()),
          videoPaths: entry.videos.map(videoInfo => new OnDemandMediaLoader({ spider: spider.spider, sourceVideoCache, spiderName, videoInfo, log: this.log })),
          lastChange: entry.timestamp,
          def: {
            link: entry.link,
            glossList: (entry.title ? [entry.title].flat() : entry.words),
            body: entry.body,
            spider: spiderName,
            key: entryID
          }
        })
        progress.tick({ spiderName, entryID })
      }

      // cleanup source videos
      await Promise.all(Object.values(sourceVideoCache).map(path => fs.remove(path) ))

      // finish the library writer if necessary
      if (!commonLibraryMode) {
        await library.finish()
      }
    }
    this.log = oldLog

    if (commonLibraryMode) {
      await library.finish()
    }

    return didRebuild
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
    let searchLibrary = await (new SearchLibraryWriter(libraryPath, {
      format: 'sint8', scaling: 8, vectorDB: this.vectorDB, shardBits, buildID,
      log: (...args)=> this.log(...args),
      keepRecentBuilds: 10, // keep a bunch because anxiety about breaking things
    })).open()

    return searchLibrary
  }

  // returns a boolean (eventually): should the dataset name passed in, be rebuilt now? does it pass expiration rules?
  async checkOutdated(datasetName) {
    let datasetPath = `${this.settings.datasetsPath}/${datasetName}`

    // if the dataset has never been built, build it
    if (!this.settings.libraryName && !await fs.pathExists(datasetPath)) return true
    if (!this.timestamps[datasetName]) return true
    
    // if the config doesn't have an expires rule, just rebuild it always
    if (!this.configs[datasetName].expires) return true

    if (this.timestamps[datasetName] < Date.now() - parseDuration(this.configs[datasetName].expires)) {
      return true
    } else {
      console.log(`Skipping ${datasetName}: not due to run for another ${prettyMs(parseDuration(this.configs[datasetName].expires) - (Date.now() - this.timestamps[datasetName]))}`)
    }

    // default to not building if none of the above is true
    return false
  }

  // build a feed of newly discovered content
  async buildDiscoveryFeeds() {
    // wait for writes to finish
    await this.writeQueue.onIdle()
    // load discovery log
    let log = []
    if (await fs.pathExists(`${this.settings.datasetsPath}/update-log.cbor`)) {
      log = cbor.decodeAll(await fs.readFile(`${this.settings.datasetsPath}/update-log.cbor`))
    }

    let feedEntries = []
    let minTimestamp = Date.now() - parseDuration(this.settings.discoveryFeed.minDuration)
    while (log.length > 0 && ((feedEntries.length < this.settings.discoveryFeed.minEntries
      || (log.length > 0 && log.slice(-1)[0].timestamp > minTimestamp))
      && feedEntries.length < this.settings.discoveryFeed.maxEntries)) {
      // remove the last entry from the log, add it to the end of the feedEntries, reversing the array
      feedEntries.push(log.pop())
    }

    // build feeds
    let feed = new Feed({
      title: this.settings.discoveryFeed.title,
      description: this.settings.discoveryFeed.description,
      id: this.settings.discoveryFeed.link,
      link: this.settings.discoveryFeed.link
    })
    
    let feedHTML = ['<!-- START Discovery Feed -->']
    let lastTimestamp = new Date(0)
    feedEntries.forEach(entry => {
      let displayName = this.configs[entry.provider].displayName || entry.provider
      feed.addItem({
        id: `${entry.provider}:${entry.id}`,
        title: `${displayName} ${entry.verb} ${[...entry.words].flat(2).join(', ').trim()}`,
        link: entry.link,
        date: new Date(entry.timestamp),
        description: `${entry.body}\n...`,
        author: { name: displayName, link: this.configs[entry.provider].providerLink },
      })
      
      let timestamp = new Date(entry.timestamp)
      if (timestamp.toLocaleDateString() != lastTimestamp.toLocaleDateString()) {
        feedHTML.push(html`<h2><time datetime="${dateFNS.format(timestamp, "yyyy-MM-dd")}">${dateFNS.format(timestamp, "EEEE, do LLLL yyyy")}</time></h2>`)
        lastTimestamp = timestamp
      }
      feedHTML.push(html`<div class=discovery_link><a href="${entry.providerLink}">${displayName}</a> ${entry.verb || 'documented'} <a href="${entry.link}">${[...entry.words].flat(2).slice(0,3).join(', ').trim()}</a></div>`)
    })
    feedHTML.push('<!-- END Discovery Feed -->')

    let updatedHTML = (await fs.readFile(this.settings.searchUIPath)).toString()
    updatedHTML = updatedHTML.replace(/ +<!-- START Discovery Feed -->(.+)<!-- END Discovery Feed -->\n/s, ()=> feedHTML.map(x => `      ${x}\n`).join(""))

    // write out feeds
    await Promise.all([
      fs.writeFile(`${this.settings.feedsPath}/discovery.rss`, feed.rss2()),
      fs.writeFile(`${this.settings.feedsPath}/discovery.atom`, feed.atom1()),
      fs.writeFile(`${this.settings.feedsPath}/discovery.json`, feed.json1()),
      fs.writeFile(`${this.settings.searchUIPath}`, updatedHTML)
    ])
  }
}




// runs a single spider, managing concurrency of executing any tasks according to the spider's configuration
class SpiderConductor {
  constructor(nest, name, config) {
    this.nest = nest
    this.name = name
    this.config = Object.assign({log: (...a) => this.log(...a) }, config)
    this.logPath = `${nest.settings.logsPath}/${name}.txt`

    this.completed = new Set()
    this.queue = new PQueue({ concurrency: this.config.concurrency !== undefined ? this.config.concurrency : 1 })
    this.writeQueue = nest.writeQueue
  }

  log(...text) {
    let message = JSON.stringify(text)
    let timestamp = Date.now()
    console.log(`${this.name}: ${message}`)
    this.writeQueue.add(async ()=> {
      await fs.appendFile(this.logPath, `${timestamp}: ${message}\n`)
    })
  }

  async runTask(...args) {
    // if this task has already been done, skip it and recurse to the next task in the queue
    if (this.completed.has(JSON.stringify(args))) {
      return
    }

    // add this task to the completed set, to make sure no other concurrent queues accept it
    this.completed.add(JSON.stringify(args))

    // looks like we have a fresh one, lets run it!
    let cmd = `spider.index(${args.map(a => util.inspect(a)).join(', ')})`
    this.log(`Running index task: ${cmd}`)
    try {
      var result = await this.spider.index(...args)
    } catch (err) {
      this.log(`Error processing ${cmd} => ${err}`)
    }

    // if we were provided more tasks, throw them on the queue!
    if (result && result.tasks) {
      result.tasks.forEach(newTask => this.queue.add(()=> this.runTask(...newTask)) )
    }
  }

  // call this before scrape() or build(), run handles it internally so it's not needed there
  async start() {
    let spiderClass = require(`${this.nest.settings.spiderPath}/${this.config.spider}.js`)
    this.spider = new spiderClass(this.config)

    if (await fs.pathExists(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`)) {
      await this.spider.restoreSerialized(await fs.readFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`))
      this.log(`Previous state restored`)
    }

    this.originalContentKeys = Object.keys(await this.spider.getContent())
  }

  // scrapes the full website, resolves promise when everything is done
  async scrape() {
    await fs.remove(this.logPath)
    this.log(`Getting ready to spider ${this.name}...`)

    // if the spider defines a beforeStart function, run it
    if (this.spider.beforeScrape) await this.spider.beforeScrape()
        
    // start the initial task, which will then spawn more tasks up to the maximum when it resolves or crashes
    this.queue.add(()=> this.runTask())

    // wait for queue to completely drain
    await this.queue.onIdle()

    // run any final clean up / organisational tasks to merge scrape data in to a consistent content library
    if (this.spider.afterScrape) await this.spider.afterScrape()
  }

  async buildID() {
    return await this.spider.buildID()
  }

  // gets content of the spider's scrape
  async getContent() {
    return await this.spider.getContent()
  }

  // gets only newly discovered content
  async getNewContent() {
    let oldKeys = this.originalContentKeys
    let content = await this.spider.getContent()
    let newContent = {}
    Object.keys(content).forEach(id => {
      if (!oldKeys.includes(id)) {
        newContent[id] = content[id]
      }
    })
    return newContent
  }

  // call this before disposing of library, to preserve state and log newly discovered content
  async finish() {
    await fs.writeFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`, await this.spider.serialize())

    this.writeQueue.add(async () => {
      // load the existing update log
      let updateLog = cbor.decodeAll(await fs.readFile(`${this.nest.settings.datasetsPath}/update-log.cbor`))

      // detect newly found content
      let newContent = await this.getNewContent()

      // filter out repeats of content that's already been in the log
      for (let key in newContent) {
        let link = newContent[key].link.toString()
        if (updateLog.some(({ link: updateLink })=> link == updateLink.toString())) {
          delete newContent[key]
        }
      }

      // build a list of new content
      let updateCbor = []
      let updateTxt = []
      for (let key of Object.keys(newContent)) {
        let content = newContent[key]
        this.log(`New: ${content.link} - ${content.words}`)
        updateCbor.push(cbor.encode({
          provider: this.name,
          providerLink: this.config.link,
          id: key,
          link: content.link,
          words: [(content.title || content.words)].flat(),
          verb: content.discoveryVerb || this.config.discoveryVerb,
          timestamp: Date.now(),
          body: content.body
        }))
        updateTxt.push(`${this.name} ${this.verb} [${content.title ? content.title : content.words.join(', ')}](${content.link}) (timestamp: ${content.timestamp || Date.now()})\n`)
      }
    
      await Promise.all([
        fs.appendFile(`${this.nest.settings.datasetsPath}/update-log.cbor`, Buffer.concat(updateCbor)),
        fs.appendFile(`${this.nest.settings.datasetsPath}/update-log.txt`, updateTxt.join(''))
      ])
    })
  }

  // scrape and build
  async run() {
    if (this.config.erase) {
      this.log(`Content erased, fresh scrape with no history`)
      this.spider.erase()
    }

    await this.scrape()
    this.log(`Index tasks have completed!`)
    await this.finish()
    // wait for logs and writes to finish writing out to disk
    await this.writeQueue.onIdle()
  }
}



let defaultRun = async () => {
  let nest = new SpiderNest({
    spiderPath: './spiders', // path to spiders directory, containing implementations of each spider type, and where frozen-data is stored
    vectorDBPath: '../datasets/vectors-cc-en-300-8bit', // path to word vector library
    datasetsPath: '../datasets', // path to datasets folder
    feedsPath: '../feeds', // path to directory where generated discovery feeds are written
    logsPath: '../logs', // path to logs directory
    searchUIPath: '../index.html', // relative path to index.html file, to write discovery log to
    libraryName: 'search-index', // should the datasets be combined in to one build? what should it be called?
    discoveryFeed: {
      minEntries: 12,
      minDuration: '1wk',
      maxEntries: 24,
      title: "Discovered Signs",
      description: "Signs that have recently been discovered by Find Sign’s robotic spiders as they explore the Auslan web",
      id: "https://find.auslan.fyi/",
      link: "https://find.auslan.fyi/"
    }
  })
  
  // load data and lock file
  await nest.load()
  
  // run in series does one spider at a time, for easier interpreting of the live terminal output
  await nest.runInSeries()
  // run executes all the spider operations at the same time, encouraging concurrency, for a faster overall scrape
  //await nest.run()
  // run a single specific spider, and force the scrape
  //await nest.runOneSpider('asphyxia', true)

  // rebuild the search libraries / common search library
  let didRebuild = await nest.buildDatasets()

  await nest.buildDiscoveryFeeds()

  if (didRebuild) {
    // if anything changed about the search index, rebuild the datasets torrent
    console.log(`Datasets changed, rebuilding datasets.torrent`)
    
    var opts = {
      name: "datasets",
      comment: "Find Sign (Australian Sign Language Search Engine) live datasets directory",
      createdBy: "WebTorrent: tools/spider.js",
      urlList: ["https://find.auslan.fyi/"]
    }

    console.log("Creating torrent...")
    let torrent = await createTorrent('../datasets', opts)
    await fs.writeFile('../datasets.torrent', torrent)
    console.log("datasets.torrent updated")
  }

  // unlock spider files
  await nest.unload()
}

defaultRun()