// Scraper to load video content from SignBank websites like Auslan Signbank
const util = require('util')
const stream = require('stream')
const fs = require('fs-extra')
const base = require('../../lib/search-spider/plugin-base')
const parseMs = require('parse-duration')
const got = require('got')
const pipeline = util.promisify(stream.pipeline)
const signSearchConfig = require('../../package.json').signSearch

// A spider which indexes a Signbank instance compatible with Auslan Signbank
// default config should look like:
// {
//   "spider": "signbank",
//   "url": "http://www.auslan.org.au/dictionary/",
//   "link": "http://www.auslan.org.au/",
//   "interval": "1m",
//   "regions": {
//     // include relative paths to region map images as keys, and arrays of tags to add to the listing when that map image is used here
//   }
// }
// The behaviour of this spider is to load the tag list, then load each tag page and each linked definition once
// then after the first run, only one page will be loaded each time to update it's scrape data, meaning normally
// only one web request is made per "interval" at a maximum
// Take a look at ./configs.json to see an example of how this is configured for Auslan Signbank
class SignBankSpider extends base {
  // scrape task routing function, detects type of scrape task requested and routes to appropriate internal function
  async index (task = false, ...args) {
    if (!task) {
      // load root tag page, ignoring workflow: tags as they are only useful internally
      // TODO: make the blocked tag prefixes configurable for compatibility with international SignBank deployments
      const tags = (await this.openJSON(this.relativeLink(this.config.url, 'ajax/tags/')))
      return {
        subtasks: tags.map(tagName =>
          ['tag', this.relativeLink(this.config.url, `tag/${encodeURI(tagName)}/?query=&page=1`)]
        )
      }
    } else if (task === 'tag') {
      // index a tag page, learning which glosses relate to which tags
      return this.tagTask(...args)
    } else if (task === 'definition') {
      // index a gloss definition page
      return this.definitionTask(...args)
    } else {
      throw new Error(`Unknown task ${util.inspect([task, ...args])}`)
    }
  }

  // reads a tag search results page and indexes links
  async tagTask (url) {
    const page = await this.openWeb(url)
    // figure out what the tag name is by extracting it from the URL and transforming it to find-sign format
    const tag = this.basenameFromURL(url).replace(':', '.').replace(/[^a-zA-Z0-9.-]+/g, '-')
    const data = { type: 'tag-page', tag, glosses: [] }

    // add subtasks for other pagination links
    const subtasks = []
    page('#searchresults > p a').each((i, aLink) => {
      subtasks.push(['tag', this.relativeLink(url, aLink.attribs.href)])
    })

    // add tasks for definitions found, if we're not on the root tags page
    page('#searchresults table a').each((i, aLink) => {
      const link = this.relativeLink(url, aLink.attribs.href)
      const gloss = this.basenameFromURL(link)
      data.glosses.push(gloss)
      // don't include asterisk listings in scrape (they're non-public and will 404)
      // but include them in data for better consistency in case they're published later
      if (!aLink.parent.childNodes.some(x => x.type === 'text' && x.data.includes('*'))) {
        subtasks.push(['definition', link])
      }
    })

    return { subtasks, data }
  }

  // scrapes a definition page, and discovers links to other definition pages that should be scraped too
  async definitionTask (url) {
    // load definition page in to virtual DOM
    const page = await this.openWeb(url)

    // build definition object
    const keywordsText = page('#keywords').first().text().replace(/[\n\t ]+/g, ' ').trim().split(': ')[1]
    let tags = []
    // if we have a map of australia, convert that to region tags using the spider config's region map
    if (this.config.regions) {
      page('#states img').toArray().forEach(img => {
        const imgSrc = this.relativeLink(url, `${img.attribs.src}`)
        for (const regionPath in this.config.regions) {
          if (this.relativeLink(url, regionPath) === imgSrc) {
            tags = [...tags, ...this.config.regions[regionPath]]
          }
        }
      })
    }

    // build definition data object, to be stored in the frozen-data and used to build search index later
    const idGloss = this.basenameFromURL(url)
    const def = {
      id: idGloss,
      link: url,
      nav: [
        [this.config.displayName, this.config.link],
        ['Dictionary', this.config.url],
        [`gloss: ${idGloss}`, url]
      ],
      title: keywordsText,
      words: this.extractWords(keywordsText),
      tags,
      videos: page('video source').toArray().map(x => x.attribs.src).filter(obj => !obj.match(/Definition/)),
      body: page('div.definition-panel').toArray().map(panel => {
        const title = page(panel).find('h3.panel-title').text()
        const entries = page(panel).find('div.definition-entry > div').toArray().map(x => x.lastChild.data.trim())
        return `${title}: ${entries.join('; ')}`
      }).join('\n').split('\n').slice(0, 5).join('\n')
    }

    // discover timestamp from Last Modified header on video
    if (def.videos.length > 0) {
      const videoInfo = await this.headRequest(def.videos[0])
      if (videoInfo.headers['last-modified']) {
        def.timestamp = Date.parse(videoInfo.headers['last-modified'])
      }
    }

    // discover links to other sign definition pages, like previous sign, next sign buttons
    const subtasks = []
    page('a.btn').toArray().forEach(aLink => {
      const link = this.relativeLink(url, aLink.attribs.href).split('?')[0]
      subtasks.push(['definition', link])
    })

    // extract the glossID from the URL
    def.id = this.basenameFromURL(def.link)

    // only return data if this listing has videos. some SignBank entries don't have videos and are corrupt.
    if (def.videos.length > 0) {
      return { subtasks, data: { type: 'definition', def } }
    } else {
      return { subtasks }
    }
  }

  // convert all the output data in to one coherant dataset
  getContent () {
    // get tasks descended from the root [] task (the ajax tags list request)
    const outputs = this.getTasks().map(task =>
      this.taskIO[JSON.stringify(task)]
    ).filter(x =>
      // filter out any tasks which haven't run, failed, or returned no data
      x && !x.failed && x.data
    ).map(x => x.data) // return an array of the data objects

    // get all the outputs of the tagTask executions
    const tagOutputs = outputs.filter(x => x.type === 'tag-page')
    // get all the outputs of the definitionTask executions
    const definitionOutputs = outputs.filter(x => x.type === 'definition')

    // create a new object to store all our definitions to it
    const content = {}
    definitionOutputs.forEach(({ def }) => {
      content[def.id] = def
    })
    // add all our tag information to those definitions
    tagOutputs.forEach(({ tag, glosses }) =>
      // iterate through all the glossID links that were on that tag results page
      glosses.forEach(gloss => {
        // if we have that definition page indexed, and it doesn't already have that tag, append the tag
        if (content[gloss] && !content[gloss].tags.includes(tag) && !tag.startsWith('workflow')) {
          content[gloss].tags.push(tag)
        }
      })
    )

    // return object, keyed by glossIDs and with def objects as values
    return content
  }

  // fetch a video for a specific piece of content
  async fetch (url) {
    const filename = this.tempFile(`${this.hash(url)}.${url.split(/\?#/g)[0].split(/([/.])/g).slice(-1)[0]}`)
    await pipeline(
      await got.stream({ url, headers: { 'User-Agent': signSearchConfig.userAgent }, timeout: parseMs(this.config.timeout || '15m') }),
      fs.createWriteStream(filename)
    )
    return filename
  }
}

module.exports = SignBankSpider
