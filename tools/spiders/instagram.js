// Scraper to load video content from instagram sources
const util = require('util')
const fs = require('fs-extra')
const ytdl = require('youtube-dl')
const base = require('../../lib/search-spider/plugin-base')
const instagram = require('user-instagram')

// A spider which indexes an instagram feed and creates a search index from that content
class InstagramSpider extends base {
  constructor (config, ...args) {
    super(config, ...args)
    this.content = {}
    this.store.push('content')
  }

  async index () {
    const titleRegexp = new RegExp(this.config.wordsRegexp[0], this.config.wordsRegexp[1])
    const { posts } = await instagram(this.config.scrapeLink || this.config.link)
    for (const post of posts) {
      // check it meets the rules
      const titleMatch = post.captionText.match(titleRegexp)
      if (titleMatch && this.checkRules(post.captionText)) {
        if (!this.content[post.shortcode]) this.content[post.shortcode] = {}
        const content = this.content[post.shortcode]

        content.id = post.shortcode
        content.link = post.link
        content.nav = [
          ['Instagram', 'https://www.instagram.com/'],
          [`@${this.config.user}`, this.config.link],
          [post.shortcode, post.link]
        ]
        content.timestamp = post.timestamp * 1000

        content.title = titleMatch[this.config.wordsRegexp[2]]
        if (this.config.modifiers) {
          if (this.config.modifiers.downcase) content.title = content.title.toLowerCase()
          if (this.config.modifiers.replace) {
            this.config.modifiers.replace.forEach(([regexpString, regexpFlags, replacementString]) => {
              content.title = content.title.replace(new RegExp(regexpString, regexpFlags), replacementString)
            })
          }
        }
        content.words = this.extractWords(content.title)
        content.tags = this.extractTags(post.captionText)
        content.body = this.stripTags(post.captionText)

        if (!content.videos) {
          const ytdlInfo = [await util.promisify(ytdl.getInfo)(post.link)].flat()
          content.videos = ytdlInfo.map((info) => (
            { instagramLink: content.link, playlistIndex: info.playlist_index, ext: info.ext }
          ))
        }
      } else {
        this.log(`Skipped ${post.captionText.split('\n')[0]}`)
      }
    }

    return { data: Object.values(this.content) }
  }

  // fetch a video for a specific piece of content
  fetch ({ instagramLink, playlistIndex, ext }) {
    return new Promise((resolve, reject) => {
      const path = this.tempFile(`${this.hash(instagramLink)}-${playlistIndex}.${ext}`)
      let args = ['--socket-timeout', '60']
      if (playlistIndex !== null) args = [...args, '--playlist-items', `${playlistIndex}`]

      // ask youtube-dl to grab the video file from Instagram
      const download = ytdl(instagramLink, args)
      // pipe the video file in to the temporary file
      download.pipe(fs.createWriteStream(path))
      // hook up events to resolve the promise when it's done downloading or has an error
      download.on('complete', () => resolve(path))
      download.on('end', () => resolve(path))
      download.on('error', (err) => reject(err))
    })
  }
}

module.exports = InstagramSpider
