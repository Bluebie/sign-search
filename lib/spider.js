// Base class for a spider. Spiders are programs which browse around other websites gathering information
// about things that can be included in the search engine
const os = require('os')
const url = require('url')
const cbor = require('borc')
const crypto = require('crypto')
const cheerio = require('cheerio')
const parseMs = require('parse-duration')
const got = require('got')

class Spider {
  constructor(config = {}) {
    this.log = config.log || console.log
    this.config = config
    this.content = {}
  }

  // restore state from a buffer created by the store() function
  async load(frozenData) {
    let data = cbor.decode(frozenData)
    this.content = data.content
  }

  // store current state and content cache to a buffer that can be restored later to resume the indexing
  async store() {
    return cbor.encode({
      content: this.content || {}
    })
  }

  // erase all content and make a fresh build
  erase() {
    this.content = {}
  }

  // generate an index of the data source
  async index(task = false) {
    throw new Error("spider.fetch not yet implemented")
  }

  // fetch a piece of content the indexer discovered and mentioned in a content entry (i.e. in videos: field)
  async fetch(content) {
    throw new Error("spider.fetch not yet implemented")
  }

  // returns a buildID value - a string that's safe as a directory name in URLs and Unix FS
  // which must change when the content changes, and ideally doesn't change when the content is the same
  buildID() {
    return this.hash(cbor.encode([this.config, this.content])).slice(0, 16).toLowerCase()
  }


  //////// internal utility functions:

  // verify a piece of text passes the rules in this spider's config
  checkRules(text) {
    return (((this.config.rules || {}).has || []).every(find => text.includes(find))) &&
           (((this.config.rules || {}).hasnt || []).every(find => !text.includes(find)))
  }

  // extract hashtags from a piece of text and return an array of strings without # prefixes
  extractTags(text) {
    return text.split('#').slice(1).map((x)=> x.split(/[ \t\n]+/, 2)[0])
  }

  // return text with any included #hashtags stripped out
  stripTags(text) {
    return text.replace(/#[a-zA-Z0-9_-]+/gi, '').trim().replace(/  +/g, ' ')
  }

  // take in a string, return an array of cleaned up words
  extractWords(text) {
    return text.split(/[^a-zA-Z0-9'‘-]+/).map((x)=> x.trim()).filter(x => x.match(/[a-zA-Z0-9]+/))
  }

  // take a string or buffer input, and create a sha256 hash in hex format
  hash(input) {
    let hash = crypto.createHash('sha256')
    hash.update(input)
    return hash.digest('hex')
  }

  // figure out a good path to use for a temporary file
  tempFile(filename) {
    return `${os.tmpdir}/${filename}`
  }

  // returns a promise which resolves with a string containing the content at this url
  async openText(url) {
    let page = await got({ url, headers: {'User-Agent': "find.auslan.fyi"}, timeout: parseMs(this.config.timeout || '30s') })
    if (page.statusCode != 200) throw new Error(`HTTP Status Code: ${page.statusCode}`)
    return page.body.toString()
  }

  // returns a promise which resolves with a cheerio decode of a html page
  async openWeb(url) {
    return cheerio.load(await this.openText(url))
  }

  async openJSON(url) {
    return JSON.parse(await this.openText(url))
  }

  // takes in the current page URL as a string, and a link url, and combines them, returning a new string url
  // which accurately calculates any relative paths with path fragment hrefs
  relativeLink(base, path) {
    return url.format(new url.URL(path, base), { fragment: false })
  }
}

module.exports = Spider