// Scraper to load video content from Auslan Stage Left's 101 Performance Signs webpage
const fs = require('fs-extra')
const youtubedl = require('youtube-dl')
const Spider = require('../../lib/spider.js')


class StageLeftSpider extends Spider {
  constructor(config, ...args) {
    super(config, ...args)
  }
  
  // scrape task routing function, detects type of scrape task requested and routes to appropriate internal function
  async index(task = false, ...args) {
    let page = await this.openWeb("http://www.auslanstageleft.com.au/media/101-auslan-theatre-signs/")

    // reset content
    this.content = {}
    page(".ult-modal-img.overlay-show").each((i, img)=> {
      let container = page(img.parent.parent)
      let glossList = container.find('h3').first().text().split(/[\\\/]+/).map((x)=> x.trim())
      let buttonID = img.attribs['data-class-id']
      let embedURL = page(`.ult-overlay.${buttonID} iframe`)[0].attribs.src
      let vimeoID = embedURL.split('/').slice(-1)[0].split("?")[0]
      let videoLink = `https://vimeo.com/${vimeoID}`
      this.content[vimeoID] = {
        id: `${vimeoID}`,
        hash: this.hash(videoLink + glossList.join(', ')),
        words: glossList,
        tags: [],
        videos: [videoLink],
        link: videoLink
      }
    })
  }

  // fetch a video for a specific piece of content
  fetch(videoLink) {
    return new Promise((resolve, reject) => {
      let path = null
      
      // ask youtube-dl to grab the video file from Vimeo
      let download = youtubedl(videoLink, ['--socket-timeout', '60'])
      // pipe the video file in to the temporary file
      download.once('info', info => {
        path = `${this.tempFile(this.hash(videoLink))}.${info.ext}`
        download.pipe(fs.createWriteStream( path ))
      })
      // hook up events to resolve the promise when it's done downloading or has an error
      download.on('complete', ()=> resolve( path ))
      download.on('end', ()=> resolve( path ))
      download.on('error', (err)=> reject( err ))
    })
  }
}

module.exports = StageLeftSpider