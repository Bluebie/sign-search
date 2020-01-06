// Scraper to load video content from instagram sources
const os = require('os')
const util = require('util')
const fs = require('fs-extra')
const ytdl = require('youtube-dl')
const Spider = require('../../lib/spider.js')
const instagram = require('user-instagram')


// A spider which indexes an instagram feed and creates a produces a search index from that content
class InstagramSpider extends Spider {
  constructor(config, ...args) {
    super(config, ...args)
  }
  
  async index(task = false) {
    let titleRegexp = new RegExp(this.config.wordsRegexp[0], this.config.wordsRegexp[1])
    let { posts } = await instagram(`https://www.instagram.com/${this.config.user}`)
    for (let post of posts) {
      // check it meets the rules
      let titleMatch = post.captionText.match(titleRegexp)
      if (titleMatch && this.checkRules(post.captionText)) {
        if (!this.content[post.shortcode]) this.content[post.shortcode] = {}
        let content = this.content[post.shortcode]

        content.id = post.shortcode
        content.link = post.link
        content.hash = this.hash(`timestamp=${post.timestamp} shortcode=${post.shortcode}: ${post.captionText}`)
        content.timestamp = post.timestamp * 1000

        content.title = titleMatch[this.config.wordsRegexp[2]]
        if (this.config.modifiers && this.config.modifiers.downcase) content.title = content.title.toLowerCase()
        content.words = this.extractWords(content.title)
        content.tags = this.extractTags(post.captionText)
        content.body = this.stripTags(post.captionText)
        
        if (!content.videos) {
          let ytdlInfo = [await util.promisify(ytdl.getInfo)(post.link)].flat()
          content.videos = ytdlInfo.map((info) => (
            { instagramLink: content.link, playlistIndex: info.playlist_index, ext: info.ext }
          ))
        }
      } else {
        this.log(`Skipped ${post.captionText.split("\n")[0]}`)
      }
    }
  }

  // fetch a video for a specific piece of content
  fetch({ instagramLink, playlistIndex, ext }) {
    return new Promise((resolve, reject) => {
      let path = this.tempFile(`${this.hash(instagramLink)}.${ext}`)
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

module.exports = InstagramSpider