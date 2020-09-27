// Scraper to load video content from instagram sources
// This version attempts to do full scrapes, making it at least ten times fancier
// in a complete view of the content
// This seems to be broken. Youtube-dl does paginate through but seems to miss some posts containing videos
// Worth looking in to, maybe it doesn't see carousel posts, or doesn't see single video posts, as they are
// different post types in instagram land
const util = require('util')
const fs = require('fs-extra')
const ytdl = require('youtube-dl')
const base = require('../../lib/search-spider/plugin-base')
//const instagram = require('user-instagram')
//const { post } = require('request')

// A spider which indexes an instagram feed and creates a search index from that content
class InstafancierSpider extends base {
  constructor(config, ...args) {
    super(config, ...args)
    this.host = "https://www.instagram.com"
  }
  
  async index(mode = 'root', shortcode) {
    if (mode == 'root') {
      // ask youtube-dl to read in the whole playlist of every post on the instagram profile
      let playlist = await util.promisify(ytdl.getInfo)(`${this.host}/${this.config.user}/`)

      let subtasks = playlist.map(item => ['post', item.id])
      return { subtasks }
    } else if (mode == 'post') {
      // use user-instagram and youtube-dl to get the detailed view of posts
      let scrape = await this.scrapePost(shortcode)
      return { data: scrape ? [scrape] : [] }
    }
  }

  async scrapePost(shortcode) {
    let titleRegexp = new RegExp(this.config.wordsRegexp[0], this.config.wordsRegexp[1])
    
    let playlist = [await util.promisify(ytdl.getInfo)(`${this.host}/p/${shortcode}/`)].flat().flat()
    let post = playlist[0]

    let titleMatch = post.description.match(titleRegexp)
    if (titleMatch && this.checkRules(post.description)) {
      let title = titleMatch[this.config.wordsRegexp[2]].trim()
      // apply text effects
      if (this.config.modifiers && this.config.modifiers.downcase) title = title.toLowerCase()
      if (this.config.modifiers && this.config.modifiers.replace) {
        this.config.modifiers.replace.forEach(([regexpString, regexpFlags, replacementString]) => {
          title = title.replace(new RegExp(regexpString, regexpFlags), replacementString)
        })
      }

      // construct dictionary definition data
      let def = {
        id: shortcode,
        link: post.webpage_url,
        nav: [
          ["Instagram", "https://www.instagram.com/"],
          [`@${this.config.user}`, this.config.link],
          [shortcode, post.webpage_url],
        ],
        timestamp: post.timestamp * 1000,
        title,
        words: this.extractWords(title),
        tags: this.extractTags(post.description),
        body: this.stripTags(post.description),
      }

      // iterate all the videos on this post
      def.videos = playlist.map(info => (
        { instagramLink: post.webpage_url, playlistIndex: info.playlistIndex, ext: info.ext }
      ))

      return def
    } else {
      this.log(`Skipped due to rules failure ${post.webpage_url} - ${post.description}`)
    }
  }

  // fetch a video for a specific piece of content
  fetch({ instagramLink, playlistIndex, ext }) {
    return new Promise((resolve, reject) => {
      let path = this.tempFile(`${this.hash(instagramLink)}-${playlistIndex}.${ext}`)
      let args = ['--socket-timeout', '60']
      if (playlistIndex !== null) args = [...args, '--playlist-items', `${playlistIndex}`]

      // ask youtube-dl to grab the video file from Instagram
      let download = ytdl(instagramLink, args)
      // pipe the video file in to the temporary file
      download.pipe(fs.createWriteStream( path ))
      // hook up events to resolve the promise when it's done downloading or has an error
      download.on('complete', ()=> resolve( path ))
      download.on('end', ()=> resolve( path ))
      download.on('error', (err)=> reject( err ))
    })
  }
}

module.exports = InstafancierSpider