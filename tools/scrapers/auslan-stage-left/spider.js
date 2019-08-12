// Spider to crawl Auslan Stage Left's 101 Auslan Theatre Signs video series
// from their website, and fetch videos with youtube-dl
const request = require('request')
const cheerio = require('cheerio')
const youtubedl = require('youtube-dl')
const VectorLibraryReader = require('../../../lib/vector-library/vector-library-reader')
const SearchLibraryWriter = require('../../../lib/search-library/writer')
const fs = require('fs')

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
    console.log(`Downloading: ${def.glossList.join(', ')}`)
    console.log(`Link: ${def.link}`)

    //await writer.append(def, [youtubedl(def.link)])
    let videoFile = `video-cache/${encodeURIComponent(def.link)}.mp4`
    // download the vimeo video
    await (new Promise((resolve, reject) => {
      let video = youtubedl(def.link)
      video.pipe(fs.createWriteStream(videoFile))
      video.on('end', ()=> resolve())
      video.on('error', (e)=> reject(e))
    }))
    await writer.append({
      words: def.glossList,
      tags: ['established'],
      def: {
        glossList: def.glossList,
        link: def.link,
      },
      videoPaths: [videoFile]
    })

    fs.unlinkSync(videoFile) // we don't need to keep these around forever
  }

  await writer.finish()

  console.log(`Auslan Stage Left index build complete`)
}

run()
