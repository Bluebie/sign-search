// Base class for a spider. Spiders are programs which browse around other websites gathering information
// about things that can be included in the search engine
const os = require('os')
const cbor = require('borc')
const URL = require('url').URL
const path = require('path')

const got = require('got') // for openText method
const cheerio = require('cheerio') // for openWeb method
const xml2js = require('xml2js') // for openXML method

const parseMs = require('parse-duration')
const objectHash = require('object-hash')
const signSearchConfig = require('../../package.json').signSearch

class SpiderPluginBase {
  constructor (config = {}) {
    this.log = config.log || console.log
    config.log = null
    this.config = config
    this.taskIO = {}
    this.store = ['taskIO']
  }

  // restore state from a buffer created by the store() function
  async restoreSerialized (frozenData) {
    const data = cbor.decode(frozenData)
    Object.entries(data).forEach(([key, value]) => {
      if (this.store.includes(key)) this[key] = value
    })
  }

  // store current state and content cache to a buffer that can be restored later to resume the indexing
  async serialize () {
    return cbor.encode(
      Object.fromEntries(
        this.store.map(key => [key, this[key]])
      )
    )
  }

  // execute an indexing task and stores results to the taskIO object for serialization and for use constructing
  // contents object in getContents()
  async executeTask (args) {
    const taskKey = JSON.stringify(args)
    const taskInfo = this.taskIO[taskKey] = this.taskIO[taskKey] || { failed: false, subtasks: [] }
    taskInfo.timestamp = Date.now()
    try {
      const output = await this.index(...args)
      if (!output) throw new Error(`Task ${args.join(', ')} returned something other than an object`)
      const { subtasks, data } = output

      taskInfo.failed = false
      taskInfo.data = data || []
      taskInfo.subtasks = subtasks || []
    } catch (err) {
      taskInfo.failed = true
      throw err
    }
  }

  // get a list of all tasks in this index, by recursively exploring through the subtasks of everything that references
  // back to the root [] task, returns array of string taskIO keys
  getTasks () {
    const tasks = {}
    const queue = [[]]
    while (queue.length) {
      const item = queue.shift()
      const key = JSON.stringify(item)

      if (key in tasks) continue

      tasks[key] = item
      const data = this.taskIO[key]

      if (data && Array.isArray(data.subtasks)) {
        data.subtasks.forEach(subtask => {
          queue.push(subtask)
        })
      }
    }

    return Object.values(tasks)
  }

  // returns a task which should be run next
  // the best task is one which has never run, or failing that, the one which ran the longest time ago
  getNextTask () {
    // if rootScrapeProbability is defined, that increases the odds of root task [] being returned
    if ('rootScrapeProbability' in this.config) {
      if (Math.random() < this.config.rootScrapeProbability) {
        return { task: [] }
      }
    }

    // get list of all the tasks that are, or are a descendant of root task []
    const tasks = this.getTasks()

    // store the most important task we have found so far
    let bestTask = null
    let bestTaskData = { timestamp: Infinity }
    for (const taskKey of tasks) {
      // attempt to lookup results of last time this task ran (if ever)
      const taskData = this.taskIO[JSON.stringify(taskKey)]

      // if it hasn't ever run, it's a priority: do it next
      if (!taskData) return { task: taskKey, timestamp: 0 }

      // otherwise, find the task which hasn't been updated for the longest time
      if (taskData.timestamp < bestTaskData.timestamp) {
        bestTask = taskKey
        bestTaskData = taskData
      }
    }

    // return the best task we found, augmented with a "task" property containing the task arguments
    return { task: bestTask, ...bestTaskData }
  }

  // get content from results of previously executed tasks
  // returns a new object which has definition id's as keys and definition data objects as values
  getContent () {
    // construct a new object from "entries" array
    return Object.fromEntries(
      // get all tasks that are related to the root [] task
      this.getTasks()
        // turn each task in to the taskIO output info
        .map(taskKey => this.taskIO[JSON.stringify(taskKey)])
        // filter out tasks that aren't defined yet (haven't ever spidered), failed, or didn't output any data
        .filter(x => x && x.data && x.data.length > 0)
        // map and then flat the data in to content entries
        .flatMap(x => x.data.map(y => [y.id, y]))
        // filter out any entries on the blocklist
        .filter(([id, def]) => (!this.config.blocklist || !this.config.blocklist.includes(id)))
    )
  }

  // generate an index of the data source
  // this method must be redefined. when called with no arguments, it's a root scrape
  // must return an object containing:
  // {
  //   data: [{definition}, ...], // an array of definitions
  //   subtasks: [['arg'], ['different arg']] // an array of tasks this one references (i.e. links)
  //                                          // index will be called later with these argument lists
  // }
  async index () {
    throw new Error('spider.index not yet implemented')
  }

  // fetch a piece of content the indexer discovered and mentioned in a content entry (i.e. in videos: field)
  // is called as needed with the value of the video in the videos array, and must return a local system path
  // to an encodable media file, or throw an error (reject promise) if it cannot fetch the content
  async fetch () {
    throw new Error('spider.fetch not yet implemented')
  }

  // returns a buildID value - a string that's safe as a directory name in URLs and Unix FS
  // which must change when the content changes, and ideally doesn't change when the content is the same
  buildID () {
    return objectHash({
      config: this.config,
      content: this.getContent()
    }, { algorithm: 'sha256' }).slice(0, 16).toLowerCase()
  }

  // internal utility functions:

  // verify a piece of text passes the rules in this spider's config
  checkRules (text) {
    return (((this.config.rules || {}).has || []).every(find => `${text}`.includes(find))) &&
           (((this.config.rules || {}).hasnt || []).every(find => !`${text}`.includes(find)))
  }

  // extract hashtags from a piece of text and return an array of strings without # prefixes
  extractTags (text) {
    return `${text}`.split('#').slice(1).map(x => x.split(/[ \t\n]+/, 2)[0])
  }

  // return text with any included #hashtags stripped out
  stripTags (text) {
    return `${text}`.replace(/#[a-zA-Z0-9._-]+/gi, '').trim().replace(/  +/g, ' ')
  }

  // take in a string, return an array of cleaned up words
  extractWords (text) {
    return `${text}`.split(/[^a-zA-Z0-9'’-]+/).map(x => x.trim()).filter(x => x.match(/^[a-zA-Z0-9'’-]+$/))
  }

  // take a string or buffer input, and create a sha256 hash in hex format
  hash (input) {
    return objectHash(input, { algorithm: 'sha256' })
  }

  // figure out a good path to use for a temporary file
  tempFile (filename) {
    return `${os.tmpdir}/${filename}`
  }

  // returns a promise which resolves with a string containing the content at this url
  async openText (url) {
    const page = await got({ url, headers: { 'User-Agent': signSearchConfig.userAgent }, timeout: parseMs(this.config.timeout || '30s') })
    if (page.statusCode !== 200) throw new Error(`HTTP Status Code: ${page.statusCode}`)
    return page.body.toString()
  }

  // returns a promise which resolves with a cheerio decode of a html page
  async openWeb (url) {
    return cheerio.load(await this.openText(url))
  }

  // HTTP GET request to a JSON api, resolves with a parsed JSON object
  async openJSON (url) {
    return JSON.parse(await this.openText(url))
  }

  async openXML (url) {
    return xml2js.parseStringPromise(await this.openText(url), {})
  }

  async headRequest (url) {
    const response = await got({
      url,
      method: 'HEAD',
      headers: { 'User-Agent': signSearchConfig.userAgent },
      timeout: parseMs(this.config.timeout || '30s')
    })
    return response
  }

  // takes in the current page URL as a string, and a link url, and combines them, returning a new string url
  // which accurately calculates any relative paths with path fragment hrefs
  relativeLink (base, path) {
    const link = new URL(path, base)
    link.hash = ''
    return link.toString()
  }

  // accepts a full absolute url (perhaps constructed with relativeLink())
  // and returns a basename - the filename ignoring extension and directories
  basenameFromURL (url, extension = '.html') {
    return decodeURIComponent(path.basename((new URL(url)).pathname, extension))
  }
}

module.exports = SpiderPluginBase
