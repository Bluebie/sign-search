// runs a single spider, managing concurrency of executing any tasks according to the spider's configuration
const fs = require('fs-extra')
const path = require('path')
const process = require('process')
const util = require('util')
const PQueue = require('p-queue').default

class SpiderConductor {
  constructor (nest, name, config) {
    this.nest = nest
    this.name = name
    this.config = Object.assign({ log: (...a) => this.log(...a) }, config)
    this.logPath = `${nest.settings.logsPath}/${name}.txt`

    this.queue = new PQueue({ concurrency: this.config.concurrency !== undefined ? this.config.concurrency : 1 })
    this.writeQueue = nest.writeQueue
  }

  log (...text) {
    const opts = { breakLength: Infinity }
    const message = text.map(x => typeof x === 'string' ? x : util.inspect(x, opts)).join(', ')
    const messageColor = text.map(x => typeof x === 'string' ? x : util.inspect(x, { ...opts, colors: true })).join(' ')
    const timestamp = (new Date()).toLocaleString()
    this.nest.log(`${this.name}: ${messageColor}`)
    this.writeQueue.add(() => fs.appendFile(this.logPath, `${timestamp}: ${message}\n`))
  }

  async runTask (taskSpec, maxAgeMs) {
    if (!taskSpec) return
    // looks like we have a fresh one, lets run it!
    const cmd = ['spider.index(', taskSpec.map(x => JSON.stringify(x)).join(', '), ')']
    this.log('Running index task:', ...cmd)
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

    const nextTask = this.spider.getNextTask(maxAgeMs)
    if (nextTask.timestamp < Date.now() - maxAgeMs) {
      this.queue.add(() => this.runTask(nextTask.task, maxAgeMs))
    }
  }

  // call this before scrape() or build(), run handles it internally so it's not needed there
  async start () {
    const basePath = path.resolve(process.cwd(), this.nest.settings.spiderPath)
    const SpiderClass = require(`${basePath}/${this.config.spider}.js`)
    this.spider = new SpiderClass(this.config)

    if (await fs.pathExists(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`)) {
      try {
        await this.spider.restoreSerialized(await fs.readFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`))
        this.log('Previous state restored')
      } catch (err) {
        this.log(`Error restoring serialized state of ${this.name} spider, ditching the data, probably going to rebuild…`)
      }
    }

    if (this.spider.initialize) await this.spider.initialize()
  }

  // scrapes the full website, resolves promise when everything is done
  async scrape (maxAgeMs) {
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

  async buildID () {
    return await this.spider.buildID()
  }

  // gets content of the spider's scrape
  async getContent () {
    return await this.spider.getContent()
  }

  // call this before disposing of library, to preserve state and log newly discovered content
  async finish () {
    this.writeQueue.add(async () =>
      await fs.writeFile(`${this.nest.settings.spiderPath}/frozen-data/${this.name}.cbor`, await this.spider.serialize())
    )
  }

  // scrape and build
  async run (maxAgeMs = Infinity) {
    await this.scrape(maxAgeMs)
    this.log('Index tasks have completed!')
    await this.finish()
    // wait for logs and writes to finish writing out to disk
    await this.writeQueue.onIdle()
  }
}

module.exports = SpiderConductor
