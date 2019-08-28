// Spider to crawl Auslan Stage Left's 101 Auslan Theatre Signs video series
// from their website, and fetch videos with youtube-dl
const request = require('request').defaults({ headers: {'User-Agent': "find.auslan.fyi"}})
const cheerio = require('cheerio')
const util = require('util')
const ytdl = require('youtube-dl')
const VectorLibraryReader = require('../../../lib/vector-library/vector-library-reader')
const SearchLibraryWriter = require('../../../lib/search-library/writer')
const fs = require('fs-extra')

const CoolDownTime = 5 // seconds

function delay(sec) {
  return new Promise((resolve, reject) => setTimeout(()=> resolve(), sec * 1000))
}

// fetch the Auslan Stage Left index on their website
function fetchIndex() {
  return new Promise((resolve, reject)=> {
    var url = "http://www.auslanstageleft.com.au/media/101-auslan-theatre-signs/"

    // grab the main 101 Auslan Theatre Signs page, and decypher it in to vimeo links
    request(url, (error, response, html) => {
      if (!error && response.statusCode == 200) {
        let web = cheerio.load(html)
        let defs = []

        web(".ult-modal-img.overlay-show").each((i, img)=> {
          let container = web(img.parent.parent)
          let glossList = container.find('h3').first().text().split(/[\\\/]+/).map((x)=> x.trim())
          let buttonID = img.attribs['data-class-id']
          let embedURL = web(`.ult-overlay.${buttonID} iframe`)[0].attribs.src
          let vimeoID = embedURL.split('/').slice(-1)[0].split("?")[0]
          let videoLink = `https://vimeo.com/${vimeoID}`
          let def = {
            glossList: glossList,
            link: videoLink
          }
          defs.push(def)
        })

        resolve(defs)
      } else {
        reject(error)
      }
    })
  })
}


// Youtube video provider the video cache in the SearchLibraryWriter can use to selectively download and delete videos as needed during the build
class VimeoDownloaderSource {
  constructor(videoURL) {
    this.url = videoURL
    this.timeout = 60
    this.info = null
  }
  
  // internal: fetch the remote info about the video
  async getInfo() {
    if (this.info) return this.info
    this.info = await util.promisify(ytdl.getInfo)(this.url)
    return this.info
  }

  // get a unique key that should change if the video's content changes
  async getKey() {
    let info = await this.getInfo()
    return `vimeo-${info.id}-timestamp-${info.timestamp}`
  }

  fetchVideo(url, filename, timeoutSec) {
    return (new Promise((resolve, reject) => {
      console.log(`Downloading video to local filename: ${filename}`)
      let video = ytdl(this.url)
      video.pipe(require('fs').createWriteStream(filename))
      video.on('end', ()=> { clearTimeout(timeout); resolve(filename) })
      video.on('error', (e)=> { clearTimeout(timeout); fs.unlink(filename).then(()=> reject(e)); })
      let timeout = setTimeout(()=> {
        video.destroy(`Timeout after ${timeoutSec} seconds waiting for youtube-dl to provide video`)
      }, timeoutSec * 1000)
    }))
  }

  // download video from youtube - writer should only do this if it's not already in the cache
  async getVideoPath() {
    try {
      await this.fetchVideo(this.url, (await this.getInfo())._filename, this.timeout)
    } catch (e) {
      console.log(`Error: ${e}:`)
      console.log(`Trying again...`)
      await this.fetchVideo(this.url, (await this.getInfo())._filename, this.timeout)
    }
    return (await this.getInfo())._filename
  }

  // once it's imported completely, we can remove the file we downloaded temporarily
  async releaseVideoPath() {
    await fs.unlink((await this.getInfo())._filename)
  }
}



async function run() {
  console.log(`Starting Build of Auslan Stage Left index`)
  let indexRoot = "../../../datasets/auslan-stage-left"
  let defs = await fetchIndex()

  console.log(`Video index parsed, beginning import/download of ${defs.length} entries`)

  let vecLib = new VectorLibraryReader()
  await vecLib.open('../../../datasets/vector-library')

  let writer = await (new SearchLibraryWriter(
    indexRoot, {format: 'sint8', scaling: 8, vectorDB: vecLib}
  )).open()

  console.log(`Setup fresh library, streaming videos in to local index...`)

  for (let def of defs) {
    console.log(`Checking: ${def.glossList.join(', ')}`)
    console.log(`Link: ${def.link}`)

    await writer.append({
      words: def.glossList.join(' ').replace(/‘/g, "'").replace(/[^a-zA-Z0-9-' ]+/g, '').replace(/ +/, ' ').split(/ /),
      tags: ['auslan-stage-left', 'description'],
      def: {
        glossList: def.glossList,
        link: def.link,
      },
      videoPaths: [new VimeoDownloaderSource(def.link)]
    })
    // give vimeo a gentler experience
    await delay(CoolDownTime)
  }

  await writer.finish()

  console.log(`Auslan Stage Left index build complete`)
}

run()
