// variant of spider.js which just outputs a search-data.json for each config

const fs = require('fs-extra')
const HandbrakeEncoder = require('../lib/search-library/encoder-handbrake')
const args = require('args')
const process = require('process')

const SpiderNest = require('../lib/search-spider/nest')

args
  .option('run', 'Run a specific named spider configuration immediately or a comma seperated list', '')
  .option('export', 'List of configs, comma seperated, to export as search-data', '')
  .option('search-data-folder', 'Folder where search data jsons should be written', './search-data')
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
        new HandbrakeEncoder({ maxWidth: 1024, maxHeight: 576, encoder: 'VP9', format: 'av_webm', twopass: true, quality: 29.0 }),
        new HandbrakeEncoder({ maxWidth: 512, maxHeight: 288, encoder: 'x264', format: 'av_mp4', quality: 22.0 })
      ]
    }
  })

  // load data and lock file
  await nest.load()

  // if (flags.run !== '') {
  //   // force a list of spiders to run immediately
  //   for (const task of flags.run.split(',')) {
  //     await nest.runOneSpider(task)
  //   }
  // } else {
  //   // run in series does one spider at a time as scheduled
  //   await nest.runInSeries()
  // }

  // list of which spiders to export content from
  const toExport = flags.export.split(',').map(x => x.trim())
  await fs.ensureDir(flags.searchDataFolder)

  // ensure output folder exists
  for (const configName in nest.configs) {
    if (toExport.includes(configName)) {
      console.log(`exporting ${configName}`)
      const spider = nest.spiders[configName]
      const content = await spider.getContent()
      const searchDataEntries = {}

      const mediaFolder = `${flags.searchDataFolder}/${configName}-media`
      await fs.ensureDir(mediaFolder)

      for (const entryID in content) {
        const entry = content[entryID]

        // transform media
        let overrideObject = {}
        if (nest.settings.overridesPath) {
          const overridePath = `${nest.settings.overridesPath}/${configName}:${entryID}.json`
          if (await fs.pathExists(overridePath)) {
            console.log(`Implementing override data from ${overridePath}`)
            overrideObject = JSON.parse(await fs.readFile(overridePath))
          }
        }

        const media = []
        for (const videoInfo of (entry.media || entry.videos)) {
          const cacheables = JSON.parse(JSON.stringify(videoInfo))
          const clipping = cacheables.clipping
          delete cacheables.clipping
          const filename = encodeURIComponent(JSON.stringify(cacheables))

          const existingMedia = await fs.readdir(mediaFolder)
          const existingMatch = existingMedia.find(x => x.startsWith(`${filename}.`))
          if (existingMatch) {
            media.push({
              method: 'fetch',
              url: `${configName}-media/${existingMatch}`,
              clipping,
              cache: JSON.stringify(cacheables)
            })
          } else {
            console.log(`downloading media ${configName}`, cacheables)
            const tempFile = await spider.spider.fetch(videoInfo)
            const ext = tempFile.split('.').slice(-1)[0]
            await fs.move(tempFile, `${mediaFolder}/${filename}.${ext}`)
            media.push({
              method: 'fetch',
              url: `${configName}-media/${filename}.${ext}`,
              clipping,
              cache: JSON.stringify(cacheables)
            })
          }
        }

        const definition = {
          title: entry.title || entry.words.join(', '),
          words: entry.keywords || entry.words,
          tags: [...(spider.config.tags || []), ...(entry.tags || [])].filter((v, i, a) => a.indexOf(v) === i).map(x => `${x}`.toLowerCase()),
          link: entry.link,
          nav: entry.nav,
          body: entry.body,
          media,
          timestamp: entry.timestamp || 0,
          provider: {
            id: configName,
            name: spider.config.displayName,
            verb: entry.discoveryVerb || spider.config.discoveryVerb || 'documented',
            link: spider.config.link
          },
          author: entry.author,
          ...overrideObject
        }

        searchDataEntries[entryID] = definition
      }

      await fs.writeJSON(`${flags.searchDataFolder}/${configName}.json`, searchDataEntries)
    }
  }

  // rebuild the search libraries / common search library
  // const didRebuild = await nest.buildDatasets()

  // unlock spider files
  await nest.unload()
}

defaultRun()
