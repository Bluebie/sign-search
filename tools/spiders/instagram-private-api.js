// Scraper to load video content from instagram sources
// This scraper tries using the instagram private app api to do it's dirty business
// If environment variables for IG_USERNAME and IG_PASSWORD are set, the spider will try to login first
const fs = require('fs-extra')
const base = require('../../lib/search-spider/plugin-base')
const got = require('got') // for downloading videos
const IgApiClient = require('instagram-private-api').IgApiClient
const process = require('process')

// A spider which indexes an instagram feed and creates a search index from that content
class InstaPrivateSpider extends base {
  constructor(...args) {
    super(...args)
    this.store.push('state') // keep the login state in cache
  }

  // startup tasks
  async initForIndex() {
    if (!this.state) this.state = {}
    if (!this.state.video_urls) this.state.video_urls = {}

    if (!InstaPrivateSpider.client) {
      InstaPrivateSpider.client = new IgApiClient()
      InstaPrivateSpider.client.state.generateDevice(`sign-search-scraper`)
    }

    this.ig = InstaPrivateSpider.client
    
    if (process.env.IG_USERNAME && process.env.IG_PASSWORD && !InstaPrivateSpider.auth) {
      this.log(`Logging in to Instagram as ${process.env.IG_USERNAME}...`)
      await this.ig.simulate.preLoginFlow()
      InstaPrivateSpider.auth = await this.ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD)
      await this.ig.simulate.postLoginFlow()
      this.log(`Logged in to Instagram as ${process.env.IG_USERNAME}`)
    }

    if (!this.state.user) {
      this.log(`Looking up target user ${this.config.user}...`)
      this.state.user = await this.ig.user.searchExact(this.config.user)
    }
  }

  async index() {
    if (!this.ig) await this.initForIndex()
    this.log(`Loading feed...`)
    let feed = await this.ig.feed.user(this.state.user.pk)

    this.state.video_urls = {}

    let collection = []
    var feedResponse = await feed.request()
    while (feedResponse && feedResponse.items.length > 0) {
      // collect up all the feed items
      feedResponse.items.forEach(item => {
        var info = {
          id: item.code,
          caption: item.caption ? item.caption.text : "",
          timestamp: item.taken_at * 1000,
        }
        // if the post has a single video...
        if (item.video_versions && item.video_versions.length > 0) {
          this.state.video_urls[item.video_versions[0].id] = item.video_versions[0].url
          info.videos = item.video_versions ? [{ id: item.video_versions[0].id, user: this.config.user }] : []
          let def = this.parsePost(info)
          if (def) collection.push(def)
        // if the post has several videos in a carousel
        } else if (item.carousel_media_count > 0 && item.carousel_media.some(x => x.media_type == 2)) {
          info.videos = item.carousel_media.filter(x => x.media_type == 2).map(v => {
            this.state.video_urls[v.video_versions[0].id] = v.video_versions[0].url
            return { id: v.video_versions[0].id, user: this.config.user }
          })
          let def = this.parsePost(info)
          if (def) collection.push(def)
        } else {
          this.log(`Skipping ${item.code} as it does not contain any videos`)
        }
      })
      // load the next page in
      if (feedResponse.more_available) {
        feedResponse = await feed.request()
      } else {
        // finished, return the subtasks
        return { data: collection }
      }
    }
  }

  // returns a post def object, or falsey if the post isn't acceptable in the scrape
  parsePost(info) {
    let def = {
      id: info.id,
      link: `https://www.instagram.com/p/${info.id}/`,
      nav: [
        ["Instagram", "https://www.instagram.com/"],
        [`@${this.config.user}`, `https://instagram.com/${this.config.user}/`],
        [info.id, `https://www.instagram.com/p/${info.id}/`],
      ],
      timestamp: info.timestamp,
      tags: this.extractTags(info.caption),
      body: this.stripTags(info.caption),
      videos: info.videos,
    }

    let titleRegexp = new RegExp(this.config.wordsRegexp[0], this.config.wordsRegexp[1])
    let titleMatch = info.caption.match(titleRegexp)
    if (titleMatch && this.checkRules(info.caption)) {
      let title = titleMatch[this.config.wordsRegexp[2]].trim()
      // apply text effects
      if (this.config.modifiers && this.config.modifiers.downcase) title = title.toLowerCase()
      if (this.config.modifiers && this.config.modifiers.replace) {
        this.config.modifiers.replace.forEach(([regexpString, regexpFlags, replacementString]) => {
          title = title.replace(new RegExp(regexpString, regexpFlags), replacementString)
        })
      }

      def.title = title
      def.words = this.extractWords(title)

      if (def.videos.length < 1) {
        return this.log(`Skipped due to no videos in entry ${info.id} - ${info.caption}`)
      }

      return def
    } else {
      this.log(`Skipped due to rules failure ${info.id} - ${info.caption}`)
    }
  }

  // fetch a video for a specific piece of content
  async fetch({ user, id }) {
    let url = this.state.video_urls[id]
    let ext = url.split('?')[0].split('.').slice(-1)[0]
    let path = this.tempFile(`insta-private-api-${user}-${id}.${ext}`)
    let req = await got(url, { responseType: 'buffer' })
    await fs.writeFile(path, req.body)
    return path
  }
}

module.exports = InstaPrivateSpider