// Out of curiosity, this tool reads the spider state data from the SignBank spider, and builds a list of
// every gloss listed in the tag listings which doesn't point to a working public sign listing. (i.e. the
// ones with an * beside them)
// This is because of a quirk in the spider, tag page scrapes include a full list of included glosses but
// only generate definition scrape tasks for ones which aren't marked with an asterisk.

const cbor = require('borc')
const fs = require('fs-extra')
const spiderPluginBase = require('../lib/search-spider/plugin-base')
const basenameFromURL = spiderPluginBase.prototype.basenameFromURL
const frozenDataPath = './spiders/frozen-data/signbank.cbor'

async function run() {
  let { taskIO } = cbor.decode(await fs.readFile(frozenDataPath))
  let knownGlosses = new Set()
  let definedGlosses = new Set()

  Object.entries(taskIO).forEach(([keyString, {data, failed, subtasks}])=> {
    if (!failed) {
      let task = JSON.parse(keyString)
      if (task[0] == 'tag') {
        data.glosses.forEach(gloss => knownGlosses.add(gloss) )
      } else if (task[0] == 'definition') {
        definedGlosses.add(data.def.id)
      }
    }
  })

  knownGlosses.forEach(gloss => {
    if (!definedGlosses.has(gloss)) console.log(gloss)
  })
}

run()