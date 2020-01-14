// Scraper to load video content from youtube playlists
const util = require('util')
const fs = require('fs-extra')
const ytdl = require('youtube-dl')
const Spider = require('../../lib/spider.js')
const vid_data = require('vid_data')
const parseDuration = require('parse-duration')
const subtitleParser = require('subtitles-parser-vtt');

// A spider which indexes an youtube playlists and creates a search index from that content
class YoutubeSpider extends Spider {
  constructor(config, ...args) {
    super(config, ...args)
    this.youtubeInfo = {}
    this.expiredCount = 0
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
    // check if youtube cache data exists and has expired
    if (this.config.expireCache && this.youtubeInfo[videoID]) {
      if (!this.config.expireCacheMax || this.expiredCount < this.config.expireCacheMax) {
        this.expiredCount += 1
        let fetched = this.youtubeInfo[videoID]._spiderFetched
        if (fetched && fetched < Date.now() - parseDuration(this.config.expireCache)) {
          delete this.youtubeInfo[videoID]
        }
      }
    }

    if (!this.youtubeInfo[videoID]) {
      let info = await util.promisify(ytdl.getInfo)(`https://www.youtube.com/watch?v=${encodeURIComponent(videoID)}`)
      let { title, ext, description, duration, webpage_url, upload_date } = info
      this.youtubeInfo[videoID] = { title, ext, description, duration, webpage_url, upload_date }
      this.youtubeInfo[videoID]._spiderFetched = Date.now()
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

    let def = {
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

    // fetch remote subtitles if necessary
    if (this.config.fetchSubtitles && !info._spideredSubtitles) {
      let options = {
        auto: false, // don't fetch autosubs (Voice To Text auto transcription)
        all: true, // download all subtitles
        format: 'vtt', // ask for the WebVTT (SRT) format
      }
      
      let subtitleFiles = await util.promisify(ytdl.getSubs)(webpage_url, options)
      info._spideredSubtitles = {}
      await Promise.all(subtitleFiles.map(async filename => {
        let lang = filename.split('.').slice(-2, -1)[0]
        info._spideredSubtitles[lang] = (await fs.readFile(filename)).toString()
        await fs.remove(filename)
      }))
    }

    // choose the best subtitle source, if any are available
    let vttText = false
    if (await fs.pathExists(`${this.config.localSubtitles}/${videoID}.srt`)) {
      vttText = (await fs.readFile(`${this.config.localSubtitles}/${videoID}.srt`)).toString()
    } else if (Object.keys(info._spideredSubtitles || {}).length == 1) {
      // if there's only one subtitle stream, use that
      vttText = Object.values(info._spideredSubtitles)[0]
    } else if (Object.keys(info._spideredSubtitles || {}).length > 1 && this.config.preferSubtitleLanguage) {
      let list = this.config.preferSubtitleLanguage.map(lang => info._spideredSubtitles[lang]).filter(x => !!x)
      if (list.length > 0) {
        vttText = list[0]
      }
    }

    if (!vttText && this.config.clipping) {
      // if clipping options are specified in the config, set them up for the spider to implement on import
      def.videos.forEach(v => v.clipping = {})
      if (this.config.clipping.start) def.videos.forEach(v => v.clipping.start = parseDuration(this.config.clipping.start) / 1000)
      if (this.config.clipping.end) def.videos.forEach(v => v.clipping.end = parseDuration(this.config.clipping.end) / 1000)
      this.content[videoID] = def
    } else if (vttText) {
      // split using subtitle timing and data
      def.videos.forEach(v => v.clipping = {}) // make sure clipping object exists
      let defJSON = JSON.stringify(def) // deep copy using JSON
      let parsedVTT = subtitleParser.fromSrt(vttText, true)
      // iterate the items in the subtitle file, creating individual sign definitions for each
      parsedVTT.forEach(({id, startTime, endTime, text}) => {
        let sliceDef = JSON.parse(defJSON) // deep copy the def by passing through JSON
        sliceDef.videos.forEach(v => { // setup the start and end times
          v.clipping.start = startTime / 1000
          v.clipping.end = endTime / 1000
        })
        sliceDef.link += `?t=${Math.floor(startTime / 1000)}` // modify link to link to specific part of video
        let taglessText = this.stripTags(text)
        sliceDef.title = taglessText.split("\n")[0]
        sliceDef.words = this.extractWords(sliceDef.title)
        sliceDef.tags = [...sliceDef.tags, ...this.extractTags(text)]
        let bodyOverride = taglessText.split("\n").slice(1).join("\n").trim()
        if (bodyOverride.length > 0) sliceDef.body = bodyOverride
        sliceDef.id += `-${id}`
        this.content[sliceDef.id] = sliceDef  
      })
    } else if (!this.config.rules || !this.config.rules.requireSubtitles) {
      // no clipping rules, just import the whole video
      this.content[def.id] = def
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