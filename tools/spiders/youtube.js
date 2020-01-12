// Scraper to load video content from youtube playlists
const util = require('util')
const fs = require('fs-extra')
const ytdl = require('youtube-dl')
const Spider = require('../../lib/spider.js')
const vid_data = require('vid_data')
const parseDuration = require('parse-duration')

// A spider which indexes an youtube playlists and creates a search index from that content
class YoutubeSpider extends Spider {
  constructor(config, ...args) {
    super(config, ...args)
    this.youtubeInfo = {}
    this.store.push('youtubeInfo')
  }
  
  async index(task = false, ...args) {
    if (!task) {
      // index playlist content and generate tasks for each video in the playlist
      let tasks = (await vid_data.get_playlist_videos(this.config.link)).map(videoID =>
        ['video', videoID]
      )
      return { tasks }
    } else if (task == 'video') {
      let [videoID] = args
      return await this.parseVideo(videoID)
    }
  }

  // fetch info about a video, parse it in to the content store
  async parseVideo(videoID) {
    if (!this.youtubeInfo[videoID]) {
      this.youtubeInfo[videoID] = await util.promisify(ytdl.getInfo)(`https://youtu.be/${encodeURIComponent(videoID)}`)
    }
    let info = this.youtubeInfo[videoID]
    let { title, ext, description, duration, webpage_url, upload_date } = info
    let timestamp = Date.UTC(upload_date.substr(0, 4), upload_date.substr(4, 2), upload_date.substr(6, 2))
    
    if (this.config.rules && this.config.rules.title && this.config.rules.title.replace) {
      this.config.rules.title.replace.forEach(rule => {
        let regexp = new RegExp(rule[0], rule[1])
        title = title.replace(regexp, rule[2]).trim()
      })
    }

    let def = this.content[videoID] = {
      id: videoID,
      link: webpage_url,
      hash: this.hash({ title, description, duration, webpage_url, upload_date }),
      timestamp,
      title,
      words: this.extractWords(title),
      tags: this.extractTags(description),
      body: this.stripTags(description),
      videos: [ { youtubeLink: webpage_url, ext } ]
    }

    // if clipping options are specified in the config, set them up for the spider to implement on import
    if (this.config.clipping) {
      def.videos.forEach(v => v.clipping = {})
      if (this.config.clipping.start) def.videos.forEach(v => v.clipping.start = parseDuration(this.config.clipping.start) / 1000)
      if (this.config.clipping.end) def.videos.forEach(v => v.clipping.end = parseDuration(this.config.clipping.end) / 1000)
    }
  }

  // fetch a video for a specific piece of content, return the path. SpiderConductor should delete the file when it's done importing
  fetch({ youtubeLink, ext }) {
    return new Promise((resolve, reject) => {
      let path = this.tempFile(`${this.hash(youtubeLink)}.${ext}`)
      let args = ['--socket-timeout', '60']

      // ask youtube-dl to grab the video file from Instagram
      let download = ytdl(youtubeLink, args)
      // pipe the video file in to the temporary file
      download.pipe(fs.createWriteStream( path ))
      // hook up events to resolve the promise when it's done downloading or has an error
      download.on('complete', ()=> resolve( path ))
      download.on('end', ()=> resolve( path ))
      download.on('error', (err)=> reject( err ))
    })
  }
}

module.exports = YoutubeSpider