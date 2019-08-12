// Spider to crawl Auslan Stage Left's 101 Auslan Theatre Signs video series
// from their website, and fetch videos with youtube-dl
const request = require('request')
const cheerio = require('cheerio')
const util = require('util')
const ytdl = require('youtube-dl')
const VectorLibraryReader = require('../../../lib/vector-library/vector-library-reader')
const SearchLibraryWriter = require('../../../lib/search-library/writer')
const fs = require('fs').promises

const importList = 'imports.txt'



// fetch the youtube playlists and index relevant data about videos included in them
async function scanPlaylists(playlistURLs) {
  let signVideos = []

  // iterate through the specified playlists importing videos from each
  for (let playlistURL of playlistURLs) {
    console.log(`checking ${playlistURL}`)
    let playlist = await util.promisify(ytdl.getInfo)(playlistURL)
    console.log(`found ${playlist.length} videos`)
    for (let info of playlist) {
      signVideos.push({
        url: info.webpage_url,
        description: info.description.replace(/#[a-zA-Z0-9_-]+/gi, '').trim(),
        tags: info.description.split('#').slice(1).map((x)=> x.split(/[ \t\n]+/, 2)[0]),
        title: info.title,
        words: info.title.split(/:/).slice(-1)[0].split(',').map((x)=> x.trim()),
        updated: (new Date(Date.UTC(info.upload_date.substr(0, 4), info.upload_date.substr(4, 2), info.upload_date.substr(6, 2)))).toISOString(),
        key: `${info.id}-${info.tbr}-${info.upload_date}-${info._duration_raw}`,
        filename: info._filename
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
  }

  // get a unique key that should change if the video's content changes
  async getKey() {
    return this.key
  }

  // download video from youtube - writer should only do this if it's not already in the cache
  getVideoPath() {
    return (new Promise((resolve, reject) => {
      console.log(`local filename: ${this.localFilename}`)
      let video = ytdl(this.url)
      video.pipe(require('fs').createWriteStream(this.localFilename))
      video.on('end', ()=> resolve(this.localFilename))
      video.on('error', (e)=> reject(e))
    }))
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
  let playlistURLs = (await fs.readFile(importList)).toString().split("\n").filter((x)=> x.trim().length > 0).map((x) => x.split(' ')[0])
  let videos = await scanPlaylists(playlistURLs)

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
