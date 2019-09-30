// Spider to crawl Auslan Stage Left's 101 Auslan Theatre Signs video series
// from their website, and fetch videos with youtube-dl
const request = require('request')
const cheerio = require('cheerio')
const util = require('util')
const ytdl = require('youtube-dl')
const VectorLibraryReader = require('../../../lib/vector-library/reader')
const SearchLibraryWriter = require('../../../lib/search-library/writer')
const fs = require('fs-extra')

const importList = 'imports.txt'
const forceRebuild = false


// fetch the youtube playlists and index relevant data about videos included in them
async function scanPlaylists(playlistURLs) {
  let signVideos = []

  // iterate through the specified playlists importing videos from each
  for (let playlistURL of Object.keys(playlistURLs)) {
    let playlistConfig = playlistURLs[playlistURL]
    console.log(`checking ${playlistURL}`)
    let playlist = await util.promisify(ytdl.getInfo)(playlistURL)
    console.log(`found ${playlist.length} videos`)

    for (let info of playlist) {
      // extract any extra prefix playlist global tags, and list of regular expressions to use to clean up title
      let playlistTags = playlistConfig.tags
      let wordsCleanRegexps = playlistConfig.wordsCleanRegexps
      let wordsList = info.title
      if (wordsCleanRegexps) {
        for (let [regexp, replacement] of wordsCleanRegexps) {
          wordsList = wordsList.replace(new RegExp(regexp, 'g'), replacement)
        }
      }

      // slice at the first : then use the last : section as a comma seperated list of words to mean average together to find vector
      wordsList = wordsList.split(/(:| - |>)/).slice(-1)[0].split(/[^a-zA-Z0-9'‘-]+/).map((x)=> x.trim()).filter(x => x.match(/[a-zA-Z0-9]+/))
      
      signVideos.push({
        url: info.webpage_url,
        description: info.description.replace(/#[a-zA-Z0-9_-]+/gi, '').trim(),
        tags: [...(playlistTags || []), ...info.description.split('#').slice(1).map((x)=> x.split(/[ \t\n]+/, 2)[0])],
        title: info.title,
        words: wordsList,
        updated: (new Date(Date.UTC(info.upload_date.substr(0, 4), info.upload_date.substr(4, 2), info.upload_date.substr(6, 2)))).toISOString(),
        key: `${info.id}-${info.upload_date}-${info._duration_raw}`,
        filename: info._filename,
        duration: info._duration_raw,
        clippingStart: (typeof(playlistConfig.trimStart) == 'number') ? playlistConfig.trimStart : false,
        clippingEnd: (typeof(playlistConfig.trimEnd) == 'number') ? info._duration_raw - playlistConfig.trimEnd : false
      })
    }
  }

  return signVideos
}



// Youtube video provider the video cache in the SearchLibraryWriter can use to selectively download and delete videos as needed during the build
class YoutubeDownloaderSource {
  constructor(videoInfo) {
    this.url = videoInfo.url
    this.key = videoInfo.key
    this.localFilename = videoInfo.filename
    if (typeof(videoInfo.clippingStart) == 'number' || typeof(videoInfo.clippingEnd) == 'number') {
      if (typeof(videoInfo.clippingStart) == 'number') this.key += `-clipping-start-${videoInfo.clippingStart}`
      if (typeof(videoInfo.clippingStart) == 'number') this.key += `-clipping-end-${videoInfo.clippingEnd}`
      this.clipping = {
        start: videoInfo.clippingStart,
        end: videoInfo.clippingEnd
      }
    }
    this.timeout = 60
  }

  // get a unique key that should change if the video's content changes
  async getKey() {
    return this.key
  }

  fetchVideo(url, filename, timeoutSec) {
    return (new Promise((resolve, reject) => {
      console.log(`local filename: ${this.localFilename}`)
      let video = ytdl(this.url)
      video.pipe(require('fs').createWriteStream(this.localFilename))
      video.on('end', ()=> { clearTimeout(timeout); resolve(this.localFilename) })
      video.on('error', (e)=> { clearTimeout(timeout); fs.unlink(filename).then(()=> reject(e)); })
      let timeout = setTimeout(()=> {
        video.destroy(`Timeout after ${timeoutSec} seconds waiting for youtube-dl to provide video`)
      }, timeoutSec * 1000)
    }))
  }

  // download video from youtube - writer should only do this if it's not already in the cache
  async getVideoPath() {
    try {
      await this.fetchVideo(this.url, this.localFilename, this.timeout)
    } catch (e) {
      console.log(`Error: ${e}:`)
      console.log(`Trying again...`)
      await this.fetchVideo(this.url, this.localFilename, this.timeout)
    }
    return this.localFilename
  }

  // once it's imported completely, we can remove the file we downloaded temporarily
  async releaseVideoPath() {
    await fs.unlink(this.localFilename)
  }
}



// main function
async function run() {
  console.log(`Starting Build of Youtube index`)
  let indexRoot = "../../../datasets/youtube"

  // fetch metadata about videos we can import
  let playlistURLs = {}
  for (let line of (await fs.readFile(importList)).toString().split("\n")) {
    if (line.trim().length > 0) {
      let [url, json] = line.split(' > ', 2)
      playlistURLs[url] = JSON.parse(json)
    }
  }

  let videos = await scanPlaylists(playlistURLs)
  if (forceRebuild || !(await fs.pathExists(`playlist-keys.json`)) || (await fs.readJSON(`playlist-keys.json`)).sort().join("\n") != videos.map(x => [x.key, x.words, x.tags].flat().join(';')).sort().join("\n")) {
    console.log(`metadata changed, rebuilding...`)
    await fs.writeJSON(`playlist-keys.json`, videos.map(x => [x.key, x.words, x.tags].flat().join(';')), { spaces: 2 })
  } else {
    console.log(`no changes detected in youtube playlists, skipping rebuild`)
    return
  }
  console.log(`metadata scan complete, ${videos.length} videos found, ready for import`)

  let vecLib = new VectorLibraryReader()
  await vecLib.open('../../../datasets/vector-library')

  let writer = await (new SearchLibraryWriter(
    indexRoot, {format: 'sint8', scaling: 8, vectorDB: vecLib}
  )).open()

  console.log(`search library open, beginning import...`)

  for (let video of videos) {
    console.log(`Importing "${video.title}"...`)
    let ytdlSource = new YoutubeDownloaderSource(video)
    await writer.append({
      words: video.words,
      tags: video.tags,
      videoPaths: [ytdlSource],
      lastChange: video.updated,
      def: {
        link: video.url,
        glossList: video.words,
        body: video.description
      }
    })
  }

  await writer.finish()

  console.log(`Youtube playlists index build complete`)
}

run()
