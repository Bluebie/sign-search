const fs = require('fs-extra')
const util = require('util')
const cbor = require('borc')
const VectorLibraryReader = require('../lib/vector-library/reader')
const SearchLibraryWriter = require('../lib/search-library/writer')
const PQueue = require('p-queue').default


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
    await fs.unlink(this.localFilename)
  }
}




// SpiderNest coordinates web spiders and executes their tasks with reasonable concurrency
class SpiderNest {
  constructor(settings) {
    this.settings = settings
  }

  async load() {
    this.configs = JSON.parse(await fs.readFile(`${this.settings.spiderPath}/configs.json`))
    this.vectorDB = new VectorLibraryReader()
    await this.vectorDB.open(this.settings.vectorDBPath)
    await fs.ensureDir(this.settings.logsPath)
  }

  // run the spiders in series, easier for debugging
  async runInSeries() {
    await this.load()

    for (let source of Object.keys(this.configs)) {
      let runner = new SpiderRunner(this, source, this.configs[source])
      // todo: not await these, just run them concurrently. Just doing this for debug
      await runner.run()
    }
  }

  // run all the spiders at the same time concurrently
  async run() {
    await this.load()

    let runners = Object.keys(this.configs).map(source => {
      let runner = new SpiderRunner(this, source, this.configs[source])
      return runner.run()
    })
    return Promise.all(runners)
  }
}




// runs a single spider, managing concurrency
class SpiderRunner {
  constructor(nest, name, config) {
    this.nest = nest
    this.name = name
    this.config = Object.assign({log: this.log}, config)
    this.logPath = `${nest.settings.logsPath}/${name}.txt`

    this.completed = new Set()
    this.queue = new PQueue({ concurrency: config.concurrency !== undefined ? config.concurrency : 1 })    
  }

  async log(...text) {
    await fs.appendFile(this.logPath, util.inspect(new Date()) + ": " + text.map(x => util.inspect(x)).join('; ') + "\n")
    console.log(`${this.name}: ${util.inspect(text.shift())}`, ...text)
  }

  async runTask(...args) {
    // if this task has already been done, skip it and recurse to the next task in the queue
    if (this.completed.has(JSON.stringify(args))) {
      return
    }

    // add this task to the completed set, to make sure no other concurrent queues accept it
    this.completed.add(JSON.stringify(args))

    // looks like we have a fresh one, lets run it!
    this.log(`Running index task: spider.index(${args.map(a => util.inspect(a)).join(', ')})`)
    let result = await this.spider.index(...args)

    // if we were provided more tasks, throw them on the queue!
    if (result && result.tasks) {
      result.tasks.forEach(newTask => this.queue.add(()=> this.runTask(...newTask)) )
    }
  }

  async run() {
    await fs.remove(this.logPath)
    this.log(`Getting ready to spider ${this.name}...`)
    
    let spiderClass = require(`${this.nest.settings.spiderPath}/${this.config.spider}.js`)
    this.spider = new spiderClass(this.config)

    if (await fs.pathExists(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`)) {
      await this.spider.load(await fs.readFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`))
      this.log(`Previous state restored`)
    }

    let originalContentKeys = Object.keys(this.spider.content)

    // if the spider defines a beforeStart function, run it
    if (this.spider.beforeStart) await this.spider.beforeStart()
    
    // start the initial task, which will then spawn more tasks up to the maximum when it resolves or crashes
    this.queue.add(()=> this.runTask())

    // wait for queue to completely drain
    await this.queue.onIdle()

    this.log(`Index tasks have completed! Building search library...`)

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

    // loop through accumulated content, writing it in to the searchLibrary and fetching any media necessary
    for (let content of Object.values(this.spider.content)) {
      this.log(`Importing ${content.link}: ${content.words.join(' ')}`)
      await searchLibrary.append({
        words: content.words,
        tags: [...(this.config.tag || []), ...content.tags],
        videoPaths: content.videos.map(videoInfo => new OnDemandMediaLoader(this.spider, videoInfo)),
        lastChange: content.timestamp,
        def: {
          link: content.link,
          glossList: (content.title ? [content.title] : content.words),
          body: content.body
        }
      })
    }
  
    await searchLibrary.finish()
  
    this.log(`Finished building ${this.name} library`)

    await fs.writeFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`, await this.spider.store())

    // detect newly found content
    let newContentKeys = Object.keys(this.spider.content).filter(key => !originalContentKeys.includes(key))
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
}




let nest = new SpiderNest({
  spiderPath: './spiders',
  vectorDBPath: '../datasets/vectors-cc-en-300-8bit',
  datasetsPath: '../datasets',
  logsPath: '../logs'
})
//nest.run() // runs spiders concurrently to minimize build length
nest.runInSeries()