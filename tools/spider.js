const fs = require('fs-extra')
const util = require('util')
const gzip = util.promisify(require('zlib').gzip)
const createTorrent = util.promisify(require('create-torrent'))
const HandbrakeEncoder = require('../lib/search-library/encoder-handbrake')
const args = require('args')
const process = require('process')

const SpiderNest = require('../lib/search-spider/nest')
const signSearchConfig = require('../package.json').signSearch

args
  .option('run', 'Run a specific named spider configuration immediately', '')
  .option('implementations', 'Path to spider implementations', './spiders')
  .option('write-frequently', 'Spiders write their state to disk frequently in case of crashes')
  .option('vector-db-path', 'path to word vector database', '../datasets/cc-en-300-8bit')
  .option('datasets-path', 'path to datasets folder where search index is built', '../datasets')
  .option('library-name', 'name of search library (folder name to build under datasets path', 'search-index')
  .option('entry-overrides-path', 'path to folder with json files defining search index data overrides', './spiders/overrides')
  .option('logs-path', 'Folder where build logs should be written', '../logs')
  .option('feeds-path', 'Folder where rss-like feeds are written', '../feeds')
  .option('library-vector-bits', 'How many bits to allocate to each dimension of each word vector in search library', 6)

const defaultRun = async () => {
  const flags = args.parse(process.argv)

  const nest = new SpiderNest({
    spiderPath: flags.implementations, // path to spiders directory, containing implementations of each spider type, and where frozen-data is stored
    vectorDBPath: flags.vectorDbPath, // path to word vector library
    datasetsPath: flags.datasetsPath, // path to datasets folder
    feedsPath: flags.feedsPath, // path to directory where generated discovery feeds are written
    logsPath: flags.logsPath, // path to logs directory
    searchUIPath: '../index.html', // relative path to index.html file, to write discovery log to
    libraryName: flags.libraryName, // should the datasets be combined in to one build? what should it be called?
    overridesPath: flags.entryOverridesPath, // directory which has "{search result uri}.json" format, which overrides values the spider fetched on specific results
    writeFrequently: flags.writeFrequently,
    searchLibraryParams: {
      vectorBits: flags.libraryVectorBits,
      mediaFormats: [
        new HandbrakeEncoder()
      ]
    }
  })

  // load data and lock file
  await nest.load()

  if (flags.run !== '') {
    // custom test run one spider immediately
    await nest.runOneSpider(flags.run)
  } else {
    // run in series does one spider at a time as scheduled
    await nest.runInSeries()
  }

  // rebuild the search libraries / common search library
  const didRebuild = await nest.buildDatasets()

  if (didRebuild) {
    // if anything changed about the search index, rebuild the datasets torrent
    nest.log('Datasets changed, rebuilding datasets.torrent')

    var opts = {
      name: 'datasets',
      comment: `${signSearchConfig.openGraph.title} dataset`,
      createdBy: 'WebTorrent, sign-search: tools/spider.js',
      urlList: [`${signSearchConfig.location}/`]
    }

    nest.log('Creating torrent...')
    const torrent = await createTorrent(args.datasetsPath, opts)
    await Promise.all([
      fs.writeFile('../datasets.torrent', torrent),
      fs.writeFile('../datasets.torrent.gz', await gzip(torrent, { level: 9 }))
    ])

    nest.log('datasets.torrent updated')
  }

  nest.log(' ============= All spider tasks complete! ============= ')

  // unlock spider files
  await nest.unload()
}

defaultRun()
