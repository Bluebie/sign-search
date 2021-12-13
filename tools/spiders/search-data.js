// Search Data spider reads a JSON file containing an array of search index entries
// feeds those entries to the search index builder to easily integrate external tools with the build process.
// Search Data does some minimal processing (hashtag detection and seperation) and provides a few
// options for loading videos using tools like youtube-dl, ytdl-core, fetch, each accepting a 'url'
// value and optionally an 'etag' value for cache expiry (url changes also cause expiry)

const fs = require('fs-extra')
const ytdl = require('ytdl-core') // ytdl javascript native youtube downloader
const youtubedl = require('youtube-dl') // very flexible youtube-dl cli tool (uses python under the hood)
const got = require('got') // for fetch method
const base = require('../../lib/search-spider/plugin-base') // base class, provides standard functionality of a spider plugin
const signSearchConfig = require('../../package').signSearch
const { pipeline } = require('stream/promises')

// A spider which indexes an youtube playlists and creates a search index from that content
class SearchDataSpider extends base {
  async index (task = false, ...args) {
    const unprocessed = JSON.parse(await fs.readFile(this.config.path))
    const processed = unprocessed.map(entry => {
      return {
        ...entry,
        title: this.stripTags(entry.title || entry.words.join(' ')),
        words: Array.isArray(entry.words) ? entry.words : this.extractWords(this.words || this.title),
        body: this.stripTags(entry.body || ''),
        id: entry.id || entry.link
      }
    })
    return { data: processed }
  }

  // fetch a video for a specific piece of content, return the path. SpiderConductor should delete the file when it's done importing
  async fetch ({ method, url, etag = '', args = [], ext = 'mp4' }) {
    if (method === 'youtube-dl') {
      const tempPath = this.tempFile(`youtube-dl-${this.hash([url, etag, args])}.${ext}`)
      return new Promise((resolve, reject) => {
        args = ['--socket-timeout', '60', ...args]

        // ask youtube-dl to grab the video file from Instagram
        const download = youtubedl(url, args)
        // pipe the video file in to the temporary file
        download.pipe(fs.createWriteStream(tempPath))
        // hook up events to resolve the promise when it's done downloading or has an error
        download.on('complete', () => resolve(tempPath))
        download.on('end', () => resolve(tempPath))
        download.on('error', (err) => reject(err))
      })
    } else if (method === 'ytdl-core') {
      return new Promise((resolve, reject) => {
        const readStream = ytdl(url, {
          lang: signSearchConfig.lang,
          quality: 'highest'
        })

        let path
        readStream.on('info', (info, format) => {
          path = this.tempFile(`ytdl-core-${this.hash(url)}.${format.container || ext}`)
          readStream.pipe(fs.createWriteStream(path))
        })
        readStream.on('end', () => resolve(path))
        readStream.on('error', (err) => reject(err))
      })
    } else if (method === 'fetch') {
      const urlObject = new URL(url)
      const urlExt = urlObject.pathname.split('.').slice(-1)
      const tempPath = this.tempFile(`fetch-${this.hash(url)}.${ext || urlExt}`)
      await pipeline(
        got.stream(url),
        fs.createWriteStream(tempPath)
      )
      return tempPath
    }
  }
}

module.exports = SearchDataSpider
