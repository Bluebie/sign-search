// Scraper to load video content from instagram sources
// This version uses instamancer with a headless chromium to browse instagram for a more thorough scrape
const fs = require('fs-extra')
const base = require('../../lib/search-spider/plugin-base')
const instamancer = require('instamancer')
const got = require('got') // for downloading videos

// A spider which indexes an instagram feed and creates a search index from that content
class InstamancerSpider extends base {
  constructor(config, ...args) {
    super(config, ...args)
    this.host = "https://www.instagram.com"
    this.instamancerOpts = {
      total: 100,
      headless: true,
      silent: true,
      enableGrafting: true,
      ...(this.config.instamancerOptions || {}),
    }
  }
  
  async index(mode = 'root', shortcode) {
    if (mode == 'root') {
      
      let shortcodes = await this.indexPosts(this.config.user)
      return {
        subtasks: shortcodes.map(shortcode => ['post', shortcode])
      }

    } else if (mode == 'post') {
      
      // use user-instagram and youtube-dl to get the detailed view of posts
      let scrape = await this.scrapePost(shortcode)
      return {
        data: scrape ? [scrape] : []
      }
    }
  }

  // returns array of Instagram shortcodes
  async indexPosts(user) {
    let api = instamancer.createApi("user", user, this.instamancerOpts)

    let shortcodes = []
    for await (let post of api.generator()) {
      shortcodes.push(post.node.shortcode)
    }

    return shortcodes
  }

  // returns a post def object, or falsey if the post isn't acceptable in the scrape
  async scrapePost(shortcode) {
    let titleRegexp = new RegExp(this.config.wordsRegexp[0], this.config.wordsRegexp[1])
    
    let api = instamancer.createApi('post', [shortcode], this.instamancerOpts)
    let posts = []
    for await (let post of api.generator()) { posts.push(post) }
    let media = posts[0].shortcode_media

    // construct dictionary definition data
    let description = media.edge_media_to_caption.edges[0].node.text
    let def = {
      id: media.shortcode,
      link: `https://www.instagram.com/p/${media.shortcode}/`,
      nav: [
        ["Instagram", "https://www.instagram.com/"],
        [`@${this.config.user}`, this.config.link],
        [shortcode, `https://www.instagram.com/p/${media.shortcode}/`],
      ],
      timestamp: media.taken_at_timestamp * 1000,
      tags: this.extractTags(description),
      body: this.stripTags(description),
    }

    //iterate all the videos on this post
    def.videos = media.edge_sidecar_to_children.edges.map(({node}) => (
      { shortcode: shortcode, id: node.id }
    ))

    let titleMatch = description.match(titleRegexp)
    if (titleMatch && this.checkRules(description)) {
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

      return def
    } else {
      this.log(`Skipped due to rules failure ${post.webpage_url} - ${post.description}`)
    }
  }

  // fetch a video for a specific piece of content
  async fetch({ shortcode, id }) {
    let api = instamancer.createApi('post', [shortcode], this.instamancerOpts)
    let posts = []
    for await (let post of api.generator()) { posts.push(post) }

    let media = posts[0].shortcode_media
    let videos = media.edge_sidecar_to_children.edges.map(({node})=> node )
    let video = videos.filter(video => video.id == id)

    let ext = videos.video_url.split('?')[0].split('.').slice(-1)[0]
    let path = this.tempFile(`instamancer-${shortcode}-${id}.${ext}`)
    let req = await got(video.video_url, { responseType: 'buffer' })
    await fs.writeFile(path, req.body)
  }
}

module.exports = InstamancerSpider