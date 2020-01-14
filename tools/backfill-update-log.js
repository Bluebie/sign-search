const SearchLibraryReader = require('../lib/search-library/reader')
const cbor = require('borc')
const fs = require('fs-extra')
const parseMs = require('parse-duration')
const ProgressBar = require('progress')
const stripJsonComments = require('strip-json-comments')

const fakeAge = "6 months"
const logPath = `../datasets/update-log.cbor`
const searchLibraryPath = `../datasets/search-index`

async function run() {
  let log = []
  if (await fs.pathExists(logPath)) {
    log = cbor.decodeAll(await fs.readFile(logPath))
    let backupPath = `${logPath}.backfill-backup`
    if (!await fs.pathExists(backupPath)) await fs.copyFile(logPath, backupPath)
  }

  let fakeTimestamp = Date.now() - parseMs(fakeAge)
  let existingLinks = new Set()
  log.forEach(({link}) => existingLinks.add(link))
  let configs = JSON.parse(stripJsonComments((await fs.readFile(`./spiders/configs.json`)).toString()))
  let reader = await (new SearchLibraryReader()).open(searchLibraryPath)
  let results = await reader.lookup() // fetch the whole library of results
  let progress = new ProgressBar(' [:bar] :rate/ips :percent :etas', {
    total: results.length, width: 80, head: '>', incomplete: ' ', clear: true
  })
  for (let entry of results) {
    let def = await reader.fetchDef(entry)
    let link = def.data.link
    let config = configs[def.data.spider]
    
    if (!existingLinks.has(link)) {
      existingLinks.add(link)
      let update = {
        provider: def.data.spider,
        providerLink: config.link,
        id: link,
        link: link,
        words: def.data.glossList.flat(),
        verb: config.discoveryVerb,
        timestamp: fakeTimestamp,
        body: def.data.body
      }
      log.unshift(update)
    }

    progress.tick()
  }

  let logEntries = log.map(x => cbor.encode(x))
  let concat = Buffer.concat(logEntries)
  await fs.writeFile(logPath, concat)
}

run()
