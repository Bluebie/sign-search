// Base class for a spider. Spiders are programs which browse around other websites gathering information
// about things that can be included in the search engine
const crypto = require('crypto')
const cbor = require('borc')

class Spider {
  constructor(config = {}) {
    this.config = config
    this.content = {}
  }

  async load(frozenData) {
    let data = cbor.decode(frozenData)
    this.content = data.content
  }

  async store() {
    return cbor.encode({
      content: this.content
    })
  }

  // generate an index of the data source
  async index(task = false) {
    throw new Error("spider.fetch not yet implemented")
  }

  // fetch a piece of content the indexer discovered
  async fetch(content) {
    throw new Error("spider.fetch not yet implemented")
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
}

module.exports = Spider