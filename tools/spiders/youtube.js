// Scraper to load video content from youtube playlists
const util = require('util')
const fs = require('fs-extra')
const ytpl = require('ytpl') // used to fetch the contents of youtube playlists
const ytdl = require('ytdl-core') // used to fetch info about the youtube videos
const base = require('../../lib/search-spider/plugin-base') // base class, provides standard functionality of a spider plugin
const parseDuration = require('parse-duration') // parse string durations, useful for parsing stuff in the config
const subtitleParser = require('subtitles-parser-vtt') // parse or construct srt/vtt style subtitle files, for slicing multi-sign videos
const signSearchConfig = require('../../package').signSearch

// A spider which indexes an youtube playlists and creates a search index from that content
class YoutubeSpider extends base {
  constructor(config, ...args) {
    super(config, ...args)
  }
  
  async index(task = false, ...args) {
    if (!task) {
      // index playlist content and generate tasks for each video in the playlist
      let playlist = (await ytpl(this.config.link, { limit: 0 }))
      let subtasks = playlist.items.map(item => 
        ['video', item.id]
      )
      return { subtasks }
    } else if (task == 'video') {
      return await this.videoTask(...args)
    }
  }

  // fetch info about a video, parse it in to the content store
  async videoTask(videoID) {
    let info = await ytdl.getBasicInfo(videoID)
    let { title, description, video_url, author, length_seconds } = info
    
    if (this.config.rules && this.config.rules.title && this.config.rules.title.replace) {
      this.config.rules.title.replace.forEach(rule => {
        let regexp = new RegExp(rule[0], rule[1])
        title = title.replace(regexp, rule[2]).trim()
      })
    }

    let def = {
      id: videoID,
      link: `https://youtu.be/${videoID}`, // important! short urls make the ?t=secs positioning work right in subtitle sliced entries
      nav: [
        ["Youtube", "https://www.youtube.com/"],
        [author.name || this.config.displayName, author.channel_url || author.user_url || this.config.link],
        [title, video_url]
      ],
      title,
      words: this.extractWords(title),
      tags: this.extractTags(description),
      body: this.stripTags(description),
      videos: [ { youtubeLink: video_url, ext: 'mp4' } ]
    }

    // choose the best subtitle source, if any are available
    let subtitles = false
    //let vttText = false
    if (this.config.localSubtitles && await fs.pathExists(`${this.config.localSubtitles}/${videoID}.srt`)) {
      subtitles = await this.openLocalSRT(`${this.config.localSubtitles}/${videoID}.srt`)
    } else if (this.config.fetchSubtitles
      && info.player_response
      && info.player_response.captions
      && info.player_response.captions.playerCaptionsTracklistRenderer
      && info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks
      && info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks.length > 0) {
      let captionTracks = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks
      let matchTrack = captionTracks.find(({languageCode})=> languageCode.includes(this.config.fetchSubtitles.toString()))
      if (matchTrack) {
        this.log(`Fetching youtube captions track "${matchTrack.name.simpleText}" for slicing`)
        subtitles = await this.openYoutubeSubs(matchTrack.baseUrl)
      }
    }

    if (!subtitles && this.config.clipping) {
      // if clipping options are specified in the config, set them up for the spider to implement on import
      def.videos.forEach(v => v.clipping = {})
      if (this.config.clipping.start) def.videos.forEach(v => v.clipping.start = parseDuration(this.config.clipping.start) / 1000)
      if (this.config.clipping.end) def.videos.forEach(v => v.clipping.end = parseDuration(this.config.clipping.end) / 1000)
      return { data: [def] }

    } else if (subtitles) {
      // split using subtitle timing and data
      def.videos.forEach(v => v.clipping = {}) // make sure clipping object exists
      // iterate the items in the subtitle file, creating individual sign definitions for each
      let slices = subtitles.map(({id, start, end, text}) => {
        let taglessText = this.stripTags(text) // text without hashtags included
        let bodyOverride = taglessText.split("\n").slice(1).join("\n").trim()
        let title = taglessText.split("\n")[0]
        let link = `${def.link}?t=${Math.floor(start)}`
        return {
          ...def,
          id: `${def.id}-start=${Math.floor(starts * 1000) / 1000}`,
          videos: def.videos.map(video => ({
            ...video,
            clipping: { start, end: Math.min(end, parseFloat(length_seconds) + 0.999) }
          })),
          title,
          link,
          nav: [...def.nav, [title, link]],
          words: this.extractWords(taglessText.split("\n")[0]),
          tags: [...def.tags, ...this.extractTags(text)],
          body: bodyOverride.length > 0 ? bodyOverride : def.body
        }
      })
      return { data: slices }
    } else {
      if (this.config.rules && this.config.rules.requireSubtitles) {
        this.log(`Video ${def.link} skipped due to requireSubtitles rule not being satisfied by any enabled subtitle sources`)
      } else {
        // no clipping rules, just import the whole video
        return { data: [def] }
      }
    }
  }

  // fetch a video for a specific piece of content, return the path. SpiderConductor should delete the file when it's done importing
  fetch({ youtubeLink }) {
    return new Promise((resolve, reject) => {
      let readStream = ytdl(youtubeLink, {
        lang: signSearchConfig.lang,
        quality: 'highestvideo',
        filter: format => format.container === 'mp4'
      })

      let path
      readStream.on('info', (info, format)=> {
        path = this.tempFile(`${this.hash(youtubeLink)}.${format.container || 'mp4'}`)
        readStream.pipe(fs.createWriteStream(path))
      })
      readStream.on('end', ()=> resolve(path))
      readStream.on('error', (err)=> reject(err))
    })
  }

  // open youtube's xml captions format and return an internal standard subtitle timing array
  async openYoutubeSubs(captionURL) {
    let xml = await this.openXML(captionURL)
    xml.transcript.text.map(({_: text, $: attr}, id)=> {
      return {
        id, text,
        start: parseFloat(attr.start),
        end: parseFloat(attr.start) + parseFloat(attr.dur)
      }
    })
  }

  // open a local srt/vtt file and return an internal standard subtitle timing array
  async openLocalSRT(path) {
    let parsedVTT = subtitleParser.fromSrt((await fs.readFile(path)).toString(), true)
    // iterate the items in the subtitle file, creating individual sign definitions for each
    return parsedVTT.map(({id, startTime, endTime, text}) => {
      return {
        id, text,
        start: startTime / 1000,
        end: endTime / 1000,
      }
    })
  }
}

module.exports = YoutubeSpider