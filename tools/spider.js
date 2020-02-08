const fs = require('fs-extra')
const util = require('util')
const gzip = util.promisify(require('zlib').gzip)
const createTorrent = util.promisify(require('create-torrent'))
const HandbrakeEncoder = require('../lib/search-library/encoder-handbrake')

const SpiderNest = require('../lib/search-spider/nest')
const signSearchConfig = require('../package.json').signSearch


let defaultRun = async () => {
  let nest = new SpiderNest({
    spiderPath: './spiders', // path to spiders directory, containing implementations of each spider type, and where frozen-data is stored
    vectorDBPath: '../datasets/cc-en-300-8bit', // path to word vector library
    datasetsPath: '../datasets', // path to datasets folder
    feedsPath: '../feeds', // path to directory where generated discovery feeds are written
    logsPath: '../logs', // path to logs directory
    searchUIPath: '../index.html', // relative path to index.html file, to write discovery log to
    libraryName: 'search-index', // should the datasets be combined in to one build? what should it be called?
    overridesPath: './spiders/overrides', // directory which has "{search result uri}.json" format, which overrides values the spider fetched on specific results
    writeFrequently: true,
    searchLibraryParams: {
      vectorBits: 6,
      mediaFormats: [
        new HandbrakeEncoder(),
        //new HandbrakeEncoder({ maxWidth: 1280, maxHeight: 720, quality: 25 }) // 720p build
      ],
    }
  })
  
  // load data and lock file
  await nest.load()
  
  // run in series does one spider at a time
  await nest.runInSeries()
  // run a single specific spider, and force the scrape
  // await nest.runOneSpider('signbank')
  // await nest.runOneSpider('asphyxia')
  // await nest.runOneSpider('community')
  // await nest.runOneSpider('signpedia')
  // await nest.runOneSpider('stage-left')
  // await nest.runOneSpider('toddslan')
  // await nest.runOneSpider('v-alford')

  // rebuild the search libraries / common search library
  let didRebuild = await nest.buildDatasets()

  if (didRebuild) {
    // if anything changed about the search index, rebuild the datasets torrent
    console.log(`Datasets changed, rebuilding datasets.torrent`)
    
    var opts = {
      name: "datasets",
      comment: `${signSearchConfig.openGraph.title} dataset`,
      createdBy: "WebTorrent: tools/spider.js",
      urlList: [`${signSearchConfig.location}/`]
    }

    console.log("Creating torrent...")
    let torrent = await createTorrent('../datasets', opts)
    await Promise.all([
      fs.writeFile('../datasets.torrent', torrent),
      fs.writeFile('../datasets.torrent.gz', await gzip(torrent, { level: 9 }))
    ])

    console.log("datasets.torrent updated")
  }

  // unlock spider files
  await nest.unload()
}

defaultRun()