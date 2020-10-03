const fs = require('fs-extra')
const cbor = require('borc')

async function run (sourceID) {
  const data = cbor.decode(await fs.readFile(`./spiders/frozen-data/${sourceID}.cbor`))
  console.log(JSON.stringify(data, null, 2))
}

const [sourceID] = process.argv.slice(-1)
run(sourceID)
