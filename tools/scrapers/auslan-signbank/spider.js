// Spider to crawl Auslan Signbank's letter indexed categories
// spider builds an intermediary cache of auslan-signbank's content and updates cache as needed
// then transforms that cache in to the compressed search-library format in /datasets/auslan-signbank
const request = require('request')
const cheerio = require('cheerio')
const VectorLibraryReader = require('../../../lib/vector-library/vector-library-reader')
const SearchLibraryWriter = require('../../../lib/search-library/writer')
const fs = require('fs')
const domain = "http://www.auslan.org.au"

let tasks = {
  index: true, // browse the dictionary keyword index and find links to definitions
  definitions: true, // load definition pages and store them in the definition cache
  videos: true, // fetch video files referenced in the definitions
  build: true // build the compressed web-friendly dataset in to the datasets collection under datasets/auslan-signbank
}

let signbankRegionMap = {
  AustraliaWide: ['everywhere', 'southern', 'northern', 'wa', 'nt', 'sa', 'qld', 'nsw', 'act', 'vic', 'tas'],
  SouthernDialect: ['southern', 'wa', 'nt', 'sa', 'vic', 'tas'],
  NorthernDialect: ['northern', 'qld', 'nsw', 'act'],
  WesternAustralia: ['wa'],
  NorthernTerritory: ['nt'],
  SouthAustralia: ['sa'],
  Queensland: ['qld'],
  NewSouthWales: ['nsw', 'act'],
  Victoria: ['vic'],
  Tasmania: ['tas']
}

// returns a promise which resolves with a cheerio decode of a html page
function openWeb(url) {
  return new Promise((resolve, reject)=> {
    request(url, (error, response, html) => {
      if (error) reject(error)
      else if (response.statusCode != 200) reject(`http status code: ${response.statusCode}`)
      else resolve(cheerio.load(html))
    })
  })
}

// async promise that resolves after a delay
function delay(sec) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, sec * 1000)
  });
}

async function fetchAlphabetLinks() {
  let url = `${domain}/dictionary/`
  console.log(`fetching alphabet links at ${url}`)
  let page = await openWeb(url)
  let links = {}
  page(".alphablock ul li a").each((i, link)=> {
    let url = `${domain}${link.attribs.href}`
    let text = link.children[0].data.trim()
    links[text] = url
  })
  return links
}

// recursively iterate through each page discovering definition links
async function fetchDefLinksFromResults(url) {
  console.log(`Loading results ${url}`)
  let page = await openWeb(url)
  let links = {}
  page("table.table a").each((i, link)=> links[link.children[0].data.trim()] = `${domain}${link.attribs.href}`)
  let nextPageLink = page("nav[aria-label='Page navigation'] ul.pagination li.active + li a")
  if (nextPageLink.length > 0) { // recurse!
    let nextPageHref = url.split('?')[0] + nextPageLink.first().attr('href')
    page = null // this memory can free now
    let nextLinks = await fetchDefLinksFromResults(nextPageHref)
    // copy the next page's links in to this object
    Object.keys(nextLinks).forEach(keyword => links[keyword] = nextLinks[keyword])
  }
  return links
}

// browse through the dictionary search results discovering links to definition pages and building
// the definition-links.json file in current working directory
async function runIndexTask() {
  console.log("fetching alphabet links")
  let alphaLinks = await fetchAlphabetLinks()

  console.log("building list of definition links")
  let defLinks = {}

  for (let firstLetter of Object.keys(alphaLinks)) {
    let url = alphaLinks[firstLetter]
    console.log(`loading all pages for ${firstLetter} starting from ${url}`)
    let alphaDefLinks = await fetchDefLinksFromResults(url)
    Object.keys(alphaDefLinks).forEach( gloss => defLinks[gloss] = alphaDefLinks[gloss] )
    console.log(`Added ${Object.keys(alphaDefLinks).length} words to definition links list from ${firstLetter}`)
  }

  console.log("Definition Links:")
  console.log(defLinks)

  fs.writeFileSync('definition-links.json', JSON.stringify(defLinks))
}

// load a definition webpage, convert it in to a definition cache file written in to definition-cache folder
async function fetchDefinition(url, loadOtherMatches = true) {
  console.log(`Loading definition page ${url}`)
  let page = await openWeb(url)
  let defID = parseInt(page('.view-words #signinfo.navbar > div.btn-group button.navbar-btn')[0].childNodes[0].data.split(' ')[1])

  let def = {}
  if (fs.existsSync(`definition-cache/${defID}.json`)) {
    // load existing cache file if it already exists
    def = JSON.parse(fs.readFileSync(`definition-cache/${defID}.json`))
  }

  def.id = defID
  def.updated = Date.now()
  def.glosses = page('#keywords').first().text().replace(/[\n\t ]+/g, ' ').trim().split(': ')[1].split(', ')
  // this commented logic doesn't work because signbank has ',' IN some of the keywords. They couldn't make it easy!
  // let boldKeywordIndex = def.glosses.indexOf(('#keywords b')[0].textContent)
  // def.glossURLNumbers = (def.glossURLNumbers || []).slice(0, def.glosses.length) // make sure the list isn't too long if there's less now
  // def.glossURLNumbers[boldKeywordIndex] = parseInt(url.split('/').slice(-1)[0].slice('-').slice(-1)[0].slice('.')[0])
  def.keywordURLs = def.keywordURLs || []
  let keywordURL = url.split('/').slice(-1)[0]
  if (def.keywordURLs.indexOf(keywordURL) == -1) def.keywordURLs.push(keywordURL)

  // extract the english definition panels
  def.definitions = page('div.definition-panel').toArray().map( panel => ({
    title: page(panel).find('h3.panel-title').text(),
    entries: page(panel).find('div.definition-entry > div').toArray().map(x => x.lastChild.data.trim())
  }))

  // locate all the videos on the page and treat them as variants. luckily page dom order is correct
  // for now, not scraping definition videos, they seem rare and not relevent to sign search anyway
  def.videos = page('video source').toArray().map( x => x.attribs.src).filter(url => !url.match(/Definition/))

  // figure out what states this definition is for
  if (page('#states').length == 0) {
    def.regions = null // no region information known
  } else {
    // example src=/static/img/maps/Auslan/Tasmania-traditional.png
    for (let img of page('#states img').toArray()) {
      let src = img.attribs.src.toString()
      let match = src.match(/\/static\/img\/maps\/Auslan\/([a-zA-Z0-9_-]+)-traditional\.(png|jpg|jpeg|gif|bpm|pdf|svg)/)
      if (match) {
        let regionLabel = match[1]
        if (signbankRegionMap[regionLabel]) def.regions = signbankRegionMap[regionLabel]
        else throw new Error(`What region is ${regionLabel}? at ${img.attribs.src}`)
      }
    }
  }

  // write out definition cache file
  fs.writeFileSync(`definition-cache/${defID}.json`, JSON.stringify(def))

  // check if there are more listings for this keyword and fetch those too
  // we had about 3,700 definitions before adding this feature
  if (loadOtherMatches) {
    // find the links in the bar at the top right of the page and build the full urls
    let otherLinks = page("#signinfo .pull-right .btn-group a.btn-default").toArray().map(el => 
      url.replace(/\/([^/]+)$/, `/${encodeURIComponent(el.attribs.href)}`)
    )
    // if we have some, send them off to also be fetched, but avoid recursion!
    if (otherLinks.length > 0) {
      console.log(`Loading ${otherLinks.length} other matches on this keyword...`)
      for (let link of otherLinks) {
        try { await fetchDefinition(link, false) }
        catch(error) { console.error(error.toString()) }
      }
      console.log(`Done! Returning to surface level scrape`)
    }
  }

  return def
}

// go to each URL in the definition-links.json file from the indexing task
// and translate those definition pages in to definition-cache files
async function runDefinitionsTask() {
  let definitionLinks = JSON.parse(fs.readFileSync('definition-links.json'))
  for (let keyword of Object.keys(definitionLinks)) {
    try {
      await fetchDefinition(definitionLinks[keyword])
    } catch (error) {
      console.error(error.toString())
    }
  }
}

function fetchVideo(url, timeoutSec = 300) {
  return new Promise((resolve, reject) => {
    let filename = `video-cache/${encodeURIComponent(url)}`

    if (fs.existsSync(filename)) { // check if modified time newer and if size correct
      console.log(`Video Exists, checking size... ${url}`)
      let req = request.head(url)

      // create timeout mechanism
      let timer = setTimeout(()=> {
        console.error(`HEAD request timed out!`)
        req.abort()
        reject(`HEAD request timed out!`)
      }, timeoutSec * 1000)

      req.on('error', (...a)=> { clearTimeout(timer); reject(...a) })
      req.on('response', function(response) {
        console.log(`HEAD: ${response.statusCode} - Remote Size: ${response.caseless.get('content-length')}`)
        clearTimeout(timer)

        if (response.statusCode.toString() == '404') {
          console.log(`Remote file missing, removing local file`)
          // if file not found, we should just delete our cached file and move on
          fs.unlinkSync(filename)
          resolve()
        } else if (parseInt(response.caseless.get('content-length')) != fs.statSync(filename).size) {
          // file size changed, remove cached file
          fs.unlinkSync(filename)
          // try again
          fetchVideo(url).then(resolve, reject)
        } else {
          console.log(`Local file seems fine, skipping`)
          resolve()
        }
      })
    } else { // just download it
      console.log(`Downloading ${url}`)
      let req = request.get(url)

      // create timeout mechanism
      let timer = setTimeout(()=> {
        req.abort()
        fs.unlinkSync(filename)
        reject(`Timeout! Partial download, removed video cache file`)
      }, timeoutSec * 1000)

      // handle state changes and stream file out to filesystem
      req.on('error', (...a)=> { clearTimeout(timer); fs.unlinkSync(filename); reject(...a) })
      req.on('end', (...a)=> { clearTimeout(timer); resolve(...a) })
      req.pipe(fs.createWriteStream(filename))
    }
  });
}

// scan through definition-cache files and download the linked video files in to the video-cache
async function runVideoFetchTask() {
  // read the definitions and build a list of video links we need to cache
  let files = fs.readdirSync('definition-cache')
  let knownVideoURLs = []
  for (let defFile of files) {
    if (defFile.match(/\.json/)) {
      let def = JSON.parse(fs.readFileSync(`definition-cache/${defFile}`))
      for (let videoURL of def.videos) {
        knownVideoURLs.push(videoURL)
      }
    }
  }

  // fetch those videos concurrently to help with high round trip latency to auslan-signbank's server in germany
  let concurrency = 5
  // build a de-duplicated list of videos, and randomly sort them for reasons ¯\_(ツ)_/¯
  let videoQueue = [...new Set(knownVideoURLs)].sort(()=> 0.5 > Math.random())
  let runQueue = async ()=> {
    let nextURL = videoQueue.shift()
    if (nextURL) {
      await fetchVideo(nextURL)
      runQueue()
    }
  }
  
  let queuePromises = []
  for (let i = 0; i < concurrency; i++) {
    queuePromises.push(runQueue())
    await delay(1) // wait one second before starting the next request to help offset the requests
  }
  
  // delete any videos that weren't included in the definitions
  let videoFiles = fs.readdirSync('video-cache')
  for (let videoFilename of videoFiles) {
    let originalURL = decodeURIComponent(videoFilename)
    if (!knownVideoURLs.includes(originalURL)) {
      console.log(`Removing unused video from cache: ${originalURL}`)
      fs.unlinkSync(`video-cache/${videoFilename}`)
    }
  }

  // wait until all the videos are done downloading
  await Promise.all(queuePromises)
}



// build this cache of a SignBank in to the compressed web-ready library in /datasets
async function runBuildTask() {
  console.log(`Starting Build of Signbank index`)
  let indexRoot = "../../../datasets/auslan-signbank"

  let vecLib = new VectorLibraryReader()
  await vecLib.open('../../../datasets/vector-library')

  let writer = await (new SearchLibraryWriter(
    indexRoot, {format: 'sint8', scaling: 8, vectorDB: vecLib}
  )).open()
  
  
  console.log(`Appending content...`)

  let defFiles = fs.readdirSync('definition-cache')
  for (let defFile of defFiles) {
    if (!defFile.match(/\.json$/)) continue // skip hidden files and other junk
    let def = JSON.parse(fs.readFileSync(`definition-cache/${defFile}`))
    await writer.append({
      words: def.glosses,
      tags: ['established', ...(def.regions || [])],
      def: {
        glossList: def.glosses,
        link: `${domain}/dictionary/words/${def.keywordURLs[0]}`,
        regions: def.regions,
        body: def.definitions.map(x=> `${x.title}: ${x.entries.join('; ')}`).join("\n")
      },
      videoPaths: def.videos.map(x=> `video-cache/${encodeURIComponent(x)}`)
    })
  }
  
  await writer.finish()
  
  console.log(`Auslan Signbank index build complete`)
}

async function run(tasks) {
  if (tasks.index) await runIndexTask()
  if (tasks.definitions) await runDefinitionsTask()
  if (tasks.videos) await runVideoFetchTask()
  if (tasks.build) await runBuildTask()
}

run(tasks).catch((err)=> console.error(err))
