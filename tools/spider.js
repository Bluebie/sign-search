const fs = require('fs-extra')
const util = require('util')
const cbor = require('borc')
const VectorLibraryReader = require('../lib/vector-library/reader')
const SearchLibraryReader = require('../lib/search-library/reader')
const SearchLibraryWriter = require('../lib/search-library/writer')
const PQueue = require('p-queue').default
const parseDuration = require('parse-duration')
const prettyMs = require('pretty-ms')


class OnDemandMediaLoader {
  constructor(spider, videoInfo) {
    this.spider = spider
    this.info = videoInfo
    if (this.info.clipping) this.clipping = this.info.clipping
  }

  // get a unique key that should change if the video's content changes
  async getKey() {
    return this.spider.hash(JSON.stringify(this.info))
  }

  // get path to video file - if no path exists, 
  async getVideoPath() {
    try {
      this.localFilename = await this.spider.fetch(this.info)
    } catch (e) {
      console.log(`Error: ${e}:`)
      console.log(`Trying again...`)
      this.localFilename = await this.spider.fetch(this.info)
    }
    return this.localFilename
  }

  // once it's imported completely, we can remove the file we downloaded temporarily
  async releaseVideoPath() {
    if (this.localFilename) await fs.unlink(this.localFilename)
  }
}




// SpiderNest coordinates a collection of configured web spiders and executes their tasks with reasonable concurrency
class SpiderNest {
  constructor(settings) {
    this.settings = settings
    this.loaded = false
    this.timestamps = {}
  }

  async load() {
    if (this.loaded) return
    this.configs = JSON.parse(await fs.readFile(`${this.settings.spiderPath}/configs.json`))
    this.vectorDB = new VectorLibraryReader()
    await this.vectorDB.open(this.settings.vectorDBPath)
    await fs.ensureDir(this.settings.logsPath)
    if (await fs.pathExists(`${this.settings.spiderPath}/frozen-data/build-timestamps.cbor`)) {
      this.timestamps = cbor.decode(await fs.readFile(`${this.settings.spiderPath}/frozen-data/build-timestamps.cbor`))
    }
    this.loaded = true
  }

  // run the spiders in series, easier for debugging
  async runInSeries(force = false) {
    await this.load()

    for (let source of Object.keys(this.configs)) {
      await this.runOneSpider(source, force)
    }
  }

  // run all the spiders at the same time concurrently
  async run(force = false) {
    await this.load()

    let runners = Object.keys(this.configs).map(source => {
      return this.runOneSpider(source, force)
    })

    return Promise.all(runners)
  }

  // run a specific spider's named config from the spiders.json file
  // optional force argument, if true, causes scrape and build to happen regardless of expiry settings
  async runOneSpider(datasetName, force = false) {
    await this.load()

    // check if this dataset is still up to date, and maybe skip spidering it
    if (!force && !await this.checkExpired(datasetName)) return

    // create a spider conductor, and ask it to do the scrape
    let runner = new SpiderConductor(this, datasetName, this.configs[datasetName])
    await runner.run()

    // log out build timestamps to file for future expiry checking
    this.timestamps[datasetName] = Date.now()
    await fs.writeFile(`${this.settings.spiderPath}/frozen-data/build-timestamps.cbor`, cbor.encode(this.timestamps))
  }

  // returns a boolean (eventually): should the dataset name passed in, be rebuilt now? does it pass expiration rules?
  async checkExpired(datasetName) {
    let datasetPath = `${this.settings.datasetsPath}/${datasetName}`

    // if the dataset has never been built, build it
    if (!await fs.pathExists(datasetPath)) return true
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
}




// runs a single spider, managing concurrency of executing any tasks according to the spider's configuration
class SpiderConductor {
  constructor(nest, name, config) {
    this.nest = nest
    this.name = name
    this.config = Object.assign({log: (...a) => this.log(...a) }, config)
    this.logPath = `${nest.settings.logsPath}/${name}.txt`

    this.completed = new Set()
    this.queue = new PQueue({ concurrency: config.concurrency !== undefined ? config.concurrency : 1 })
    this.logQueue = new PQueue({ concurrency: 1 })
  }

  log(...text) {
    this.logQueue.add(async ()=> {
      console.log(`${this.name}: ${util.inspect(text.shift())}`, ...text)
      await fs.appendFile(this.logPath, util.inspect(new Date()) + ": " + text.map(x => util.inspect(x)).join('; ') + "\n")
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
    await fs.remove(this.logPath)
    this.log(`Getting ready to spider ${this.name}...`)
    
    let spiderClass = require(`${this.nest.settings.spiderPath}/${this.config.spider}.js`)
    this.spider = new spiderClass(this.config)

    if (await fs.pathExists(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`)) {
      await this.spider.load(await fs.readFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`))
      this.log(`Previous state restored`)
    }

    this.originalContentKeys = Object.keys(this.spider.content)
  }

  // scrapes the full website, resolves promise when everything is done
  async scrape() {
    // if the spider defines a beforeStart function, run it
    if (this.spider.beforeStart) await this.spider.beforeStart()
        
    // start the initial task, which will then spawn more tasks up to the maximum when it resolves or crashes
    this.queue.add(()=> this.runTask())

    // wait for queue to completely drain
    await this.queue.onIdle()
  }

  // builds a search library in the datasets path, downloading any missing videos and transcoding them
  // resolves promise when everything is finished, library is fully written and closed
  async build() {
    // build search library
    let libraryPath = `${this.nest.settings.datasetsPath}/${this.name}`
    await fs.ensureDir(libraryPath)

    // calculate how many shardBits are needed to make each json definition block be about 15kb big
    let shardBits = 1
    let contentLength = Object.keys(this.spider.content).length
    // calculate a buildID that changes when the content does
    let buildID = this.spider.buildID()
    while (contentLength / 30 > 2 ** shardBits) shardBits += 1
    let searchLibrary = await (new SearchLibraryWriter(libraryPath, {
      format: 'sint8', scaling: 8, vectorDB: this.nest.vectorDB, shardBits, buildID
    })).open()

    if (searchLibrary.skipBuild) {
      this.log(`Skipping import stage as library is not being built`)
    } else {
      // loop through accumulated content, writing it in to the searchLibrary and fetching any media necessary
      for (let content of Object.values(this.spider.content)) {
        this.log(`Importing ${content.link}: ${content.words.join(' ')}`)
        await searchLibrary.append({
          words: content.words,
          tags: [...(this.config.tag || []), ...(content.tags || [])],
          videoPaths: content.videos.map(videoInfo => new OnDemandMediaLoader(this.spider, videoInfo)),
          lastChange: content.timestamp,
          def: {
            link: content.link,
            glossList: (content.title ? [content.title].flat() : content.words),
            body: content.body
          }
        })
      }
    
      await searchLibrary.finish()
    }
  
    this.log(`Finished building ${this.name} library`)
  }

  // call this before disposing of library, to preserve state and log newly discovered content
  async finish() {
    await fs.writeFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`, await this.spider.store())

    // detect newly found content
    let newContentKeys = Object.keys(this.spider.content).filter(key => !this.originalContentKeys.includes(key))
    // build a list of new content
    for (let key of newContentKeys) {
      let content = this.spider.content[key]
      this.log(`New: ${content.link} - ${content.words}`)
      await fs.appendFile(`${this.nest.settings.datasetsPath}/update-log.cbor`, cbor.encode({
        timestamp: content.timestamp || Date.now(),
        words: content.words,
        link: content.link,
        provider: this.name
      }))
      await fs.appendFile(`${this.nest.settings.datasetsPath}/update-log.txt`, 
        `provider: ${this.name}; timestamp: ${content.timestamp || Date.now()}; words: ${content.words}; link: ${content.link}\n`
      )
    }
  }

  // scrape and build
  async run() {
    await this.start()
    await this.scrape()
    this.log(`Index tasks have completed! Building search library...`)
    await this.build()
    await this.finish()
    // wait for logs to finish writing
    await this.logQueue.onIdle()
  }
}




let nest = new SpiderNest({
  spiderPath: './spiders',
  vectorDBPath: '../datasets/vectors-cc-en-300-8bit',
  datasetsPath: '../datasets',
  logsPath: '../logs'
})

// run in series does one spider at a time, for easier interpreting of the live terminal output
//nest.runInSeries()
// run executes all the spider operations at the same time, encouraging concurrency, for a faster overall scrape
nest.run(true)

// rebuild signbank without scraping
// let rebuild = async (datasetName) => {
//   await nest.load()
//   let runner = new SpiderConductor(this, datasetName, nest.configs[datasetName])
//   return await runner.build()
// }
// rebuild()