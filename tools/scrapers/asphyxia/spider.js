// Spider to import and slice and dice the Asphyxia videos, following the timing values in the timing files in the ./timing directory
const util = require('util')
const ytdl = require('youtube-dl')
const VectorLibraryReader = require('../../../lib/vector-library/reader')
const SearchLibraryWriter = require('../../../lib/search-library/writer')
const fs = require('fs-extra')

const DefaultTags = ['asphyxia', 'established', 'vic']

// parse the plain text timing files in ./timing/ and generate manually recorded metadata needed to correctly edit the videos
async function parseTimingFile(textData) {
  let lines = textData.split("\n").filter(x => !x.match(/^#/) && x.trim().length > 0)
  let [youtubeID, label] = lines.shift().split(' - ', 2)
  let youtubeURL = `https://www.youtube.com/watch?v=${ youtubeID.trim() }`

  let currentTimestamp = 0, m = null, output = []
  for (let line of lines) {
    if (m = line.trim().match(/^([0-9:.]+) ([^\n>]+)( > (.*))?$/)) {
      let [_, timestampStr, words, _2, body] = m
      let time = parseFloat(timestampStr.split(':', 2)[0]) * 60
      time += parseFloat(timestampStr.split(':', 2)[1])
      if (output.length > 0) output.slice(-1)[0].end = time
      if (words.trim().toLowerCase() != "#end") {
        let tagList = new Set(DefaultTags)
        let negativeTags = new Set()

        body = body ? body.replace(/ *-#([a-zA-Z0-9_-]+) */gi, (input, p1)=> {
          negativeTags.add(p1.trim())
          return ' '
        }).trim() : false

        body = body ? body.replace(/ *#([a-zA-Z0-9_-]+) */gi, (input, p1)=> {
          tagList.add(p1.trim())
          return ' '
        }).trim() : false

        negativeTags.forEach((tag) => tagList.delete(tag))

        output.push({
          start: time,
          end: false,
          words: words.split(',').map(x => x.trim()),
          tags: [...tagList],
          body: body
        })
      }
    }
  }
  return {
    url: youtubeURL,
    sequence: output
  }
}




// fetch metadata from youtube
async function fetchMetadata(youtubeURL) {
  let info = await util.promisify(ytdl.getInfo)(youtubeURL)
  return {
    url: info.webpage_url,
    id: info.webpage_url.split('/watch?v=')[1],
    description: info.description.replace(/#[a-zA-Z0-9_-]+/gi, '').trim(),
    tags: info.description.split('#').slice(1).map((x)=> x.split(/[ \t\n]+/, 2)[0]),
    title: info.title,
    key: `${info.id}-${info.tbr}-${info.upload_date}-${info._duration_raw}`,
    duration: info._duration_raw,
    filename: info._filename
  }
}




class CachingYoutubeDownloaderSource {
  constructor(timing, metadata) {
    this.url = metadata.url
    this.fetched = false
    this.localFilename = metadata.filename
  }

  // get a unique key that should change if the video's content changes
  async getKey() {
    return this.key
  }

  // download video from youtube - writer should only do this if it's not already in the cache
  async getVideoPath() {
    if (!await fs.pathExists(this.localFilename)) {
      return await (new Promise((resolve, reject) => {
        console.log(`!!! Downloading Youtube video at: ${this.localFilename}`)
        let video = ytdl(this.url) //, ['--format=137/136/22/135/mp4'])
        video.pipe(require('fs').createWriteStream(this.localFilename))
        video.on('end', ()=> { this.fetched = true; resolve(this.localFilename) })
        video.on('error', (e)=> reject(e))
      }))
    } else {
      return this.localFilename
    }
  }

  // once it's imported completely, we can remove the file we downloaded temporarily
  async releaseVideoPath() {
    // no-op because we might still need it to generate the next clipped section
  }

  async actuallyRelease() {
    if (await fs.pathExists(this.localFilename)) {
      await fs.unlink(this.localFilename)
    }
  }
}



async function run() {
  console.log(`Starting Build of Asphyxia index`)
  let indexRoot = "../../../datasets/asphyxia"

  let vecLib = new VectorLibraryReader()
  await vecLib.open('../../../datasets/vectors-cc-en-300-8bit')

  let writer = await (new SearchLibraryWriter(
    indexRoot, {
      format: 'sint8',
      scaling: 8,
      vectorDB: vecLib,
      //buildTimestamp: Math.max(... await Promise.all((await fs.readdir('timing')).map(async (fn)=>
      //  Math.floor((await fs.stat(`timing/${fn}`)).mtimeMs)
      shardBits: 4
    }
  )).open()

  console.log(`Beginning import...`)

  let metadataCache = (await fs.pathExists(`metadata-cache.json`)) ? (await fs.readJSON(`metadata-cache.json`)) : {}
  let count = 0
  
  // fetch metadata about videos we can import - TODO: remove the slice 0-1 to do the whole set
  let files = (await fs.readdir('timing')).filter(x => x.match(/\.txt$/)).sort((a,b)=> parseInt(a) - parseInt(b))
  console.log("files: ", files)
  for (let filename of files) {
    console.log(`For file: ${filename}`)
    let timing = await parseTimingFile((await fs.readFile(`timing/${filename}`)).toString())
    if (!metadataCache[filename]) metadataCache[filename] = await fetchMetadata(timing.url)
    let metadata = metadataCache[filename]

    // setup a youtube downloader, in case the video data is required to build a cache video
    let ytdlSource = new CachingYoutubeDownloaderSource(timing, metadata)

    for (let clip of timing.sequence) {
      ytdlSource.key = `${metadata.id}-start-${clip.start}-end-${clip.end || metadata.duration}`
      ytdlSource.clipping = clip
      if (clip.words.join(' ').trim() != '#skip') {
        console.log(`Adding to search index: ${clip.words.join(', ')}`)
        await writer.append({
          words: clip.words.map((x) => x.replace(/[()?.,;:!]/g, '').split(/[^a-zA-Z0-9-'‘]+/).filter(x => x.trim() != '')),
          tags: clip.tags,
          videoPaths: [ytdlSource],
          lastUpdated: (await fs.stat(`timing/${filename}`)).mtimeMs,
          def: {
            link: `https://youtu.be/${metadata.id}?t=${Math.floor(clip.start)}`,
            glossList: clip.words,
            body: clip.body || metadata.description || ''
          }
        })
        count += 1
      }
    }

    // done with this video, if it downloaded, it can be deleted now
    await ytdlSource.actuallyRelease()
  }

  await writer.finish()
  await fs.writeJSON(`metadata-cache.json`, metadataCache, { spaces: 2 })

  console.log(`Asphyxia index build complete, ${count} sign clips included`)
}

run()
