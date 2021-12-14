// Scraper to load video content from youtube playlists
const fs = require('fs-extra')
const ytpl = require('ytpl') // used to fetch the contents of youtube playlists
const ytdl = require('ytdl-core') // used to fetch info about the youtube videos
const base = require('../../lib/search-spider/plugin-base') // base class, provides standard functionality of a spider plugin
const parseDuration = require('parse-duration') // parse string durations, useful for parsing stuff in the config
const subtitleParser = require('subtitles-parser-vtt') // parse or construct srt/vtt style subtitle files, for slicing multi-sign videos
const signSearchConfig = require('../../package').signSearch
const PM = {
  xml: require('pigeonmark-xml'),
  ...require('pigeonmark-select'),
  ...require('pigeonmark-utils')
}

// A spider which indexes an youtube playlists and creates a search index from that content
class YoutubeSpider extends base {
  async index (task = false, ...args) {
    if (!task) {
      // index playlist content and generate tasks for each video in the playlist
      const playlist = await ytpl(this.config.link, { limit: Infinity })
      const subtasks = playlist.items.map(item =>
        ['video', item.id]
      )
      return { subtasks }
    } else if (task === 'video') {
      return await this.videoTask(...args)
    }
  }

  // fetch info about a video, parse it in to the content store
  async videoTask (videoID) {
    const info = await ytdl.getBasicInfo(videoID)
    let { title, description, video_url: videoURL, author, lengthSeconds, publishDate } = info.videoDetails

    if (this.config.rules && this.config.rules.title && this.config.rules.title.replace) {
      this.config.rules.title.replace.forEach(rule => {
        const regexp = new RegExp(rule[0], rule[1])
        title = title.replace(regexp, rule[2]).trim()
      })
    }

    const def = {
      id: videoID,
      link: `https://youtu.be/${videoID}`, // important! short urls make the ?t=secs positioning work right in subtitle sliced entries
      nav: [
        ['Youtube', 'https://www.youtube.com/'],
        [author.name || this.config.displayName, author.channel_url || author.user_url || this.config.link],
        [title, videoURL]
      ],
      title,
      words: this.extractWords(title),
      tags: this.extractTags(description),
      body: this.stripTags(description),
      timestamp: Date.parse(publishDate),
      videos: [
        { link: videoURL }
      ]
    }

    // choose the best subtitle source, if any are available
    let subtitles = false

    if (this.config.localSubtitles && await fs.pathExists(`${this.config.localSubtitles}/${videoID}.srt`)) {
      subtitles = await this.openLocalSRT(`${this.config.localSubtitles}/${videoID}.srt`)
    } else if (this.config.fetchSubtitles &&
        info.player_response &&
        info.player_response.captions &&
        info.player_response.captions.playerCaptionsTracklistRenderer &&
        info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks &&
        info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks.length > 0) {
      const captionTracks = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks
      const matchTrack = captionTracks.find(({ languageCode }) => languageCode.includes(this.config.fetchSubtitles.toString()))
      if (matchTrack) {
        this.log(`Fetching youtube captions track "${matchTrack.name.simpleText}" for slicing`)
        subtitles = await this.openYoutubeSubs(matchTrack.baseUrl)
      }
    }

    if (!subtitles && this.config.clipping) {
      // if clipping options are specified in the config, set them up for the spider to implement on import
      def.videos.forEach(v => { v.clipping = {} })
      if (this.config.clipping.start) def.videos.forEach(v => { v.clipping.start = parseDuration(this.config.clipping.start) / 1000 })
      if (this.config.clipping.end) def.videos.forEach(v => { v.clipping.end = parseDuration(this.config.clipping.end) / 1000 })
      return { data: [def] }
    } else if (subtitles) {
      // split using subtitle timing and data
      def.videos.forEach(v => { v.clipping = {} }) // make sure clipping object exists
      // iterate the items in the subtitle file, creating individual sign definitions for each
      const slices = subtitles.map(({ id, start, end, text }) => {
        const taglessText = this.stripTags(text) // text without hashtags included
        const bodyOverride = taglessText.split('\n').slice(1).join('\n').trim()
        const title = taglessText.split('\n')[0]
        const link = `${def.link}?t=${Math.floor(start)}`
        return {
          ...def,
          id: `${def.id}-start=${Math.floor(start * 1000) / 1000}`,
          videos: def.videos.map(video => ({
            ...video,
            clipping: { start, end: Math.min(end, parseFloat(lengthSeconds) + 0.999) }
          })),
          title,
          link,
          nav: [...def.nav, [title, link]],
          words: this.extractWords(taglessText.split('\n')[0]),
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
  fetch ({ link }) {
    return new Promise((resolve, reject) => {
      const readStream = ytdl(link, {
        lang: signSearchConfig.lang,
        quality: 'highest'
      })

      let path
      readStream.on('info', (info, format) => {
        path = this.tempFile(`${this.hash(link)}.${format.container || 'mp4'}`)
        readStream.pipe(fs.createWriteStream(path))
      })
      readStream.on('end', () => resolve(path))
      readStream.on('error', (err) => reject(err))
    })
  }

  // open youtube's xml captions format and return an internal standard subtitle timing array
  async openYoutubeSubs (captionURL) {
    const xml = PM.xml.decode(await this.openText(captionURL))
    return PM.selectAll(xml, 'p').map((p, id) => {
      return {
        id,
        text: PM.get.text(p),
        start: parseFloat(PM.get.attribute(p, 'start')),
        end: parseFloat(PM.get.attribute(p, 'start')) + parseFloat(PM.get.attribute(p, 'dur'))
      }
    })
  }

  // open a local srt/vtt file and return an internal standard subtitle timing array
  async openLocalSRT (path) {
    const parsedVTT = subtitleParser.fromSrt((await fs.readFile(path)).toString(), true)
    // iterate the items in the subtitle file, creating individual sign definitions for each
    return parsedVTT.map(({ id, startTime, endTime, text }) => {
      return {
        id,
        text,
        start: startTime / 1000,
        end: endTime / 1000
      }
    })
  }
}

module.exports = YoutubeSpider
