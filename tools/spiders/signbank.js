// Scraper to load video content from SignBank websites like Auslan Signbank
const util = require('util')
const stream = require('stream')
const fs = require('fs-extra')
const nodeurl = require('url')
const path = require('path')
const Spider = require('../../lib/spider.js')
const parseMs = require('parse-duration')
const got = require('got')
const pipeline = util.promisify(stream.pipeline)

// A spider which indexes an instagram feed and creates a produces a search index from that content
// default config should be:
// {
//   "spider": "signbank",
//   "domain": "https://www.auslan.org.au/",
//   "timeout": 60
// }
class SignBankSpider extends Spider {
  constructor(config, ...args) {
    super(config, ...args)
    this.store.push('glossTags')
  }

  beforeScrape() {
    this.glossTags = {}
  }
  
  // scrape task routing function, detects type of scrape task requested and routes to appropriate internal function
  async index(task = false, ...args) {
    if (!task) {
      // load root tag page
      return { tasks: [
        ['tag', this.relativeLink(this.config.url, 'tag/')]
      ]}
    } else if (task == 'tag') {
      // index stuff linked from a tag results page
      return this.indexTag(...args)
    // } else if (task == 'search') {
    //   // scrape a search result page
    //   return this.indexSearchResults(...args)
    } else if (task == 'definition') {
      // scrape a definition page
      return this.indexDefinitionPage(...args)
    } else {
      throw new Error(`Unknown task ${util.inspect([task, ...args])}`)
    }
  }

  // reads a tag search results page and indexes links
  async indexTag(url) {
    let tasks = []
    let page = await this.openWeb(url)

    // add tasks for other tag listings, and secondary paginations of this tag listing
    page('#tags .tag a, #searchresults > p a').each((i, aLink)=> {
      tasks.push(['tag', this.relativeLink(url, aLink.attribs.href)])
    })

    // add tasks for definitions found, if we're not on the root tags page
    if (!url.match(/tag\/$/)) {
      let tagName = this.basenameFromURL(url).replace(':', '.').replace(/[^a-zA-Z0-9.-]+/g, '-')
      page('#searchresults table a').each((i, aLink)=> {
        let link = this.relativeLink(url, aLink.attribs.href)
        let gloss = this.basenameFromURL(link)
        this.glossTags[gloss] = [...(this.glossTags[gloss] || []), tagName]
        tasks.push(['definition', link])
      })
    }

    return { tasks }
  }

  // adds extra signbank tags after scraping is complete
  async afterScrape() {
    for (let gloss of Object.keys(this.glossTags)) {
      if (!this.content[gloss]) continue
      this.content[gloss].tags = [...this.content[gloss].tags, ...this.glossTags[gloss]]
    }
  }

  // scrapes a definition page, and discovers links to other definition pages that should be scraped too
  async indexDefinitionPage(url) {
    let tasks = []

    // load definition page in to virtual DOM
    let page = await this.openWeb(url)

    // build definition object
    let keywordsText = page('#keywords').first().text().replace(/[\n\t ]+/g, ' ').trim().split(': ')[1]
    let def = {
      link: url,
      title: keywordsText,
      words: this.extractWords(keywordsText, ','),
      tags: [],
      videos: page('video source').toArray().map( x => x.attribs.src ).filter(obj => !obj.match(/Definition/)),
      body: page('div.definition-panel').toArray().map( panel => {
        let title = page(panel).find('h3.panel-title').text()
        let entries = page(panel).find('div.definition-entry > div').toArray().map(x => x.lastChild.data.trim())
        return `${title}: ${entries.join('; ')}`
      }).join("\n").split("\n").slice(0, 5).join("\n")
    }
    
    // if we have a map of australia, convert that to region tags using the spider config's region map
    page('#states img').toArray().forEach(img => {
      let imgSrc = this.relativeLink(url, `${img.attribs.src}`)
      for (let regionPath in this.config.regions) {
        if (this.relativeLink(url, regionPath) == imgSrc) {
          def.tags = [...def.tags, ...this.config.regions[regionPath]]
        }
      }
    })
    
    // discover links to other sign definition pages, like previous sign, next sign, and the numbered alternate definitions for this keyword
    page("a.btn").toArray().forEach(aLink => {
      let link = this.relativeLink(url, aLink.attribs.href).split('?')[0]
      tasks.push([ 'definition', link ])
    })

    // calculate hash by sorting the def object and hashing it's keys and values in a sorted way
    def.id = this.basenameFromURL(def.link)
    def.hash = this.hash(def)
    this.content[def.id] = def

    return { tasks }
  }

  // extracts the gloss from the definition url, or tag from the tag search results pages
  basenameFromURL(url, ext='.html') {
    return decodeURIComponent(path.basename(nodeurl.parse(url).pathname, ext))
  }

  // fetch a video for a specific piece of content
  async fetch( url ) {
    let filename = this.tempFile(`${this.hash(url)}.${url.split(/\?#/g)[0].split(/([\/.])/g).slice(-1)[0]}`)
    await pipeline(
      await got.stream({ url, headers: {'User-Agent': "find.auslan.fyi"}, timeout: parseMs(this.config.timeout || '15m') }),
      fs.createWriteStream(filename)
    )
    return filename
  }
}

module.exports = SignBankSpider