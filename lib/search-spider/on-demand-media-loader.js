// On Demand Media Loader is a layer to simplify connecting the Media Cache system in the Search Library
// file writer tools, to the simple spider fetch interface for loading content
const objectHash = require('object-hash')

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

  getExtension() {
    return this.info.extension
  }

  // gets a hash without including clipping data, for source video identification
  getSourceVideoHash() {
    let info = JSON.parse(JSON.stringify(this.info))
    if (info.clipping) info.clipping = false
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

  toString() {
    return `<OnDemandMediaLoader for ${this.spiderName} ${JSON.stringify(this.info)}>`
  }
}

module.exports = OnDemandMediaLoader