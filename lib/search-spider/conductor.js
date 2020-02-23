// runs a single spider, managing concurrency of executing any tasks according to the spider's configuration
const fs = require('fs-extra')
const path = require('path')
const process = require('process')
const util = require('util')
const fsutil = require('../sign-search-utils')
const cbor = require('borc')
const PQueue = require('p-queue').default

class SpiderConductor {
  constructor(nest, name, config) {
    this.nest = nest
    this.name = name
    this.config = Object.assign({log: (...a) => this.log(...a) }, config)
    this.logPath = `${nest.settings.logsPath}/${name}.txt`

    this.queue = new PQueue({ concurrency: this.config.concurrency !== undefined ? this.config.concurrency : 1 })
    this.writeQueue = nest.writeQueue
  }

  log(...text) {
    let opts = { breakLength: Infinity }
    let message = text.map(x => typeof(x) == 'string' ? x : util.inspect(x, opts)).join(', ')
    let messageColor = text.map(x => typeof(x) == 'string' ? x : util.inspect(x, {...opts, colors: true})).join(' ')
    let timestamp = Date.now()
    this.nest.log(`${this.name}: ${messageColor}`)
    this.writeQueue.add(()=> fs.appendFile(this.logPath, `${timestamp}: ${message}\n`) )
  }

  async runTask(taskSpec, maxAgeMs) {
    if (!taskSpec) return
    // looks like we have a fresh one, lets run it!
    let cmd = ['spider.index(', taskSpec.map(x => JSON.stringify(x)).join(', '), ')']
    this.log(`Running index task:`, ...cmd)
    try {
      await this.spider.executeTask(taskSpec)
    } catch (err) {
      this.log('Error processing', ...cmd, '=>', err)
    }
    if (this.nest.settings.writeFrequently) {
      this.writeQueue.add(async () => 
        await fs.writeFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`, await this.spider.serialize())
      )
    }

    let nextTask = this.spider.getNextTask(maxAgeMs)
    if (nextTask.timestamp < Date.now() - maxAgeMs) {
      this.queue.add(() => this.runTask(nextTask.task, maxAgeMs))
    }
  }

  // call this before scrape() or build(), run handles it internally so it's not needed there
  async start() {
    let basePath = path.resolve(process.cwd(), this.nest.settings.spiderPath)
    let spiderClass = require(`${basePath}/${this.config.spider}.js`)
    this.spider = new spiderClass(this.config)

    if (await fs.pathExists(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`)) {
      await this.spider.restoreSerialized(await fs.readFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`))
      this.log(`Previous state restored`)
    }

    //this.originalContentKeys = Object.keys(await this.spider.getContent())
  }

  // scrapes the full website, resolves promise when everything is done
  async scrape(maxAgeMs) {
    await fs.remove(this.logPath)
    this.log(`Getting ready to spider ${this.name}...`)

    // if the spider defines a beforeStart function, run it
    if (this.spider.beforeScrape) await this.spider.beforeScrape()
    
    // start the initial task, which will then spawn more tasks up to the maximum when it resolves or crashes
    this.queue.add(() =>
      this.runTask(this.spider.getNextTask().task, maxAgeMs)
    )

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
  // async getNewContent() {
  //   let oldKeys = this.originalContentKeys
  //   let content = await this.spider.getContent()
  //   let newContent = {}
  //   Object.keys(content).forEach(id => {
  //     if (!oldKeys.includes(id)) {
  //       newContent[id] = content[id]
  //     }
  //   })
  //   return newContent
  // }

  // call this before disposing of library, to preserve state and log newly discovered content
  async finish() {
    this.writeQueue.add(async () => 
      await fs.writeFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`, await this.spider.serialize())
    )

    this.writeQueue.add(async () => {
      // load the existing update log
      let updateLog = cbor.decodeAll(await fs.readFile(`${this.nest.settings.datasetsPath}/update-log.cbor`))

      // grab an object of all this spider's current content, shallow copied
      let content = { ...await this.getContent() }

      // filter out repeats of content that's already been in the log
      for (let [key, entry] of Object.entries(content)) {
        let link = entry.link.toString()
        if (updateLog.some( logEntry => link == logEntry.link.toString())) {
          delete content[key]
        }
      }

      // build a list of new content
      let updateCbor = []
      let updateTxt = []
      for (let [key, entry] of Object.entries(content)) {
        this.log(`New: ${entry.link} - ${entry.words}`)
        updateCbor.push(cbor.encode({
          provider: this.name,
          providerLink: this.config.link,
          id: key,
          link: entry.link,
          words: [(entry.title || entry.words)].flat(),
          verb: entry.discoveryVerb || this.config.discoveryVerb,
          timestamp: Date.now(),
          body: entry.body
        }))
        updateTxt.push(`${this.name} ${this.verb} [${entry.title ? entry.title : entry.words.join(', ')}](${entry.link}) (timestamp: ${entry.timestamp || Date.now()})\n`)
      }
    
      await Promise.all([
        fs.appendFile(`${this.nest.settings.datasetsPath}/update-log.cbor`, Buffer.concat(updateCbor)),
        fs.appendFile(`${this.nest.settings.datasetsPath}/update-log.txt`, updateTxt.join(''))
      ])
    })
  }

  // scrape and build
  async run(maxAgeMs = Infinity) {
    await this.scrape(maxAgeMs)
    this.log(`Index tasks have completed!`)
    await this.finish()
    // wait for logs and writes to finish writing out to disk
    await this.writeQueue.onIdle()
  }
}

module.exports = SpiderConductor