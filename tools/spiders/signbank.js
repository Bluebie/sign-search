// Scraper to load video content from SignBank websites like Auslan Signbank
const util = require('util')
const stream = require('stream')
const fs = require('fs-extra')
const Spider = require('../../lib/spider.js')
const parseMs = require('parse-duration')
const got = require('got')
const pipeline = util.promisify(stream.pipeline)
const cbor = require('borc')

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
  }

  // restore state from a buffer created by the store() function
  async load(frozenData) {
    let data = cbor.decode(frozenData)
    this.content = data.content
    this.glossTags = data.glossTags
  }

  // store current state and content cache to a buffer that can be restored later to resume the indexing
  async store() {
    return cbor.encode({
      content: this.content || {},
      glossTags: this.glossTags || {}
    })
  }

  beforeScrape() {
    this.erase() // always erase the content and do a fresh build with signbank
    this.glossTags = {}
  }
  
  // scrape task routing function, detects type of scrape task requested and routes to appropriate internal function
  async index(task = false, ...args) {
    if (!task) {
      // root scrape
      // Note: Disabled to focus on glosses
      //return this.indexAlphabet(...args)
      //return this.indexTags(...args)
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

  // ask SignBank server for tag list
  // async indexTags() {
  //   let tags = await this.openJSON(this.relativeLink(this.config.url, 'ajax/tags/'))
  //   return {
  //     tasks: tags.map(tag => ['tag', this.relativeLink(this.config.url, `ajax/tag/${encodeURIComponent(tag)}/`)])
  //   }
  // }

  // reads a tag search results page and indexes links
  async indexTag(url) {
    let tasks = []
    let page = await this.openWeb(url)

    // add tasks for other tag listings, and secondary paginations of this tag listing
    page('#tags .tag a, #searchresults > p a').each((i, aLink)=> {
      tasks.push(['tag', this.relativeLink(url, aLink.attribs.href)])
    })

    // add tasks for definitions found
    let tagName = page('#activetag a').text().trim().replace(/[^a-zA-Z0-9-]+/g, '-')
    page('#searchresults table a').each((i, aLink)=> {
      let link = this.relativeLink(url, aLink.attribs.href)
      this.glossTags[link] = [tagName, ...(this.glossTags[link] || [])]
      tasks.push(['definition', link])
    })

    return { tasks }
  }

  // adds extra signbank tags after scraping is complete
  async afterScrape() {
    for (let link of Object.keys(this.glossTags)) {
      if (!this.content[link]) continue
      this.content[link].tags = [...this.content[link].tags, ...this.glossTags[link]]
    }
  }

  // // handles root scrape - it loads the dictionary root page, and indexes the alphabet links, generating tasks to read those search result pages
  // async indexAlphabet() {
  //   let tasks = []

  //   let url = this.config.url
  //   let page = await this.openWeb(url)
  //   page(".alphablock ul li a").each((i, link) => {
  //     tasks.push([ 'search', this.relativeLink(url, link.attribs.href) ])
  //   })

  //   return { tasks }
  // }

  // // scrapes search result pages, discovering links to other content like definitions and other search result pages
  // async indexSearchResults(url) {
  //   let tasks = []

  //   // load search results page
  //   let page = await this.openWeb(url)
    
  //   // extract links to definitions in search results
  //   page("table.table a").each((i, link) => {
  //     tasks.push([ 'definition', this.relativeLink(url, link.attribs.href) ])
  //   })

  //   // extract pagination links to the rest of the search results and append them as possible tasks
  //   // NOTE: spider host app should skip any redundant tasks as long as they JSON serialise the same way so this wont create loops
  //   page("nav[aria-label='Page navigation'] ul.pagination li a").each((i, link) => {
  //     tasks.push([ 'search', this.relativeLink(url, link.attribs.href) ])
  //   })

  //   return { tasks }
  // }

  // scrapes a definition page, and discovers links to other definition pages that should be scraped too
  // NOTE: this intentionally discovers the previous and next sign pages, to navigate around any missing content
  // since Auslan Signbank seems to display only 49 results on each search results page of 50 results
  // and to discover 'rude' signs, which are filtered in the search results view but do seem to be accessible otherwise
  async indexDefinitionPage(url) {
    let tasks = []

    // load definition page in to virtual DOM
    let page = await this.openWeb(url)

    // build definition object
    let keywords = page('#keywords').first().text().replace(/[\n\t ]+/g, ' ').trim().split(': ')[1].split(', ')
    let def = {
      link: url,
      title: keywords,
      words: keywords.map(x => x.replace(/[()]/g, '').split(/[^a-zA-Z0-9']+/).map(y => y.trim()).filter(x => x.length > 0)),
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
    def.id = /\/gloss\/(.*).html/.exec(def.link)[1]
    def.hash = this.hash(Object.keys(def).sort().map(key => `${key}: ${JSON.stringify(def[key])}`).join(','))
    this.content[def.id] = def

    return { tasks }
  }

  // fetch a video for a specific piece of content
  async fetch( url ) {
    let filename = this.tempFile(`${this.hash(url)}.${url.split(/\?#/g)[0].split(/([\/.])/g).slice(-1)[0]}`)
    await pipeline(
      await got.stream({ url, headers: {'User-Agent': "find.auslan.fyi"}, timeout: parseMs(this.config.timeout || '5m') }),
      fs.createWriteStream(filename)
    )
    return filename
  }
}

module.exports = SignBankSpider