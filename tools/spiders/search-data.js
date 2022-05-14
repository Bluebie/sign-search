// Search Data spider reads a JSON file containing an array of search index entries
// feeds those entries to the search index builder to easily integrate external tools with the build process.
// Search Data does some minimal processing (hashtag detection and seperation) and provides a few
// options for loading videos using tools like youtube-dl, ytdl-core, fetch, each accepting a 'url'
// value and optionally an 'etag' value for cache expiry (url changes also cause expiry)
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')
const events = require('events')
const ytdl = require('ytdl-core') // ytdl javascript native youtube downloader
const got = require('got') // for fetch method
const base = require('../../lib/search-spider/plugin-base') // base class, provides standard functionality of a spider plugin
const signSearchConfig = require('../../package').signSearch
const { pipeline } = require('stream/promises')
const YAML = require('yaml')
const nodeURL = require('node:url')

// A spider which indexes an youtube playlists and creates a search index from that content
class SearchDataSpider extends base {
  async index (task = false, ...args) {
    if (task !== false) return {}

    const dataPath = new URL(this.config.path, nodeURL.pathToFileURL(__filename))

    let unprocessed
    if (dataPath.protocol === 'file:') {
      unprocessed = YAML.parse((await fs.readFile(dataPath)).toString('utf-8'))
    } else if (dataPath.protocol.startsWith('http')) {
      unprocessed = YAML.parse(await got(dataPath).text())
    }

    const asArray = Array.isArray(unprocessed) ? unprocessed : Object.entries(unprocessed).map(([k, v]) => ({ id: k, ...v }))
    const processed = asArray.map(entry => {
      return {
        ...entry,
        title: this.stripTags(entry.title || entry.words.join(' ')),
        words: Array.isArray(entry.words) ? entry.words : this.extractWords(`${entry.words || entry.title}`),
        body: this.stripTags(entry.body || ''),
        id: entry.id || entry.link
      }
    })
    return { data: processed }
  }

  // fetch a video for a specific piece of content, return the path. SpiderConductor should delete the file when it's done importing
  async fetch ({ method, url, etag = '', args = [], ext = 'mp4' }) {
    if (method === 'youtube-dl') {
      const pathTemplate = path.join(os.tmpdir(), `youtube-dl-%(extractor)s-%(id)s-${this.hash({ url, etag, args, ext })}.${ext || '%(ext)s'}`)
      const download = spawn('youtube-dl', ['--socket-timeout', '60', '-o', pathTemplate, ...args, url], { stdio: ['inherit', 'pipe', 'inherit'] })

      await events.once(download, 'spawn')
      this.log(`youtube-dl process spawned, downloading ${url}...`)
      const output = []
      for await (const chunk of download.stdout) {
        output.push(chunk)
        this.log(chunk.toString('utf-8').trim())
      }

      // extract destination path from stdout log
      const stdoutLog = Buffer.concat(output).toString('utf-8')
      const destinationMatch = stdoutLog.match(/^\[download\] Destination: ([^\n\r]+)$/m)
      const mergingMatch = stdoutLog.match(/^\[ffmpeg\] Merging formats into "([^\n\r"]+)"$/m)

      if (mergingMatch) {
        return mergingMatch[1]
      } else if (destinationMatch) {
        return destinationMatch[1]
      } else {
        this.log(stdoutLog)
        throw new Error('Couldn\'t figure out where the file was saved, oh no! Check the regexes in tools/spiders/search-data.js?')
      }
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
      const searchDataURL = new URL(this.config.path, nodeURL.pathToFileURL(__filename))
      const urlObject = new URL(url, searchDataURL)
      const urlExt = urlObject.pathname.split('.').slice(-1)
      const tempPath = this.tempFile(`fetch-${this.hash(url)}.${ext || urlExt}`)
      if (urlObject.protocol.toLowerCase() === 'file:') {
        // try to hardlink file, if that fails, copy it
        try {
          await fs.link(urlObject.pathname, tempPath)
        } catch (err) {
          console.info(`hardlinking ${urlObject} failed, copying...`)
          await fs.copyFile(urlObject.pathname, tempPath)
        }
      } else if (['http:', 'https:'].includes(urlObject.protocol.toLowerCase())) {
        await pipeline(
          got.stream(urlObject),
          fs.createWriteStream(tempPath)
        )
      }
      return tempPath
    }
  }
}

module.exports = SearchDataSpider
