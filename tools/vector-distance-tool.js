const VectorLibraryReader = require('../lib/vector-library/reader')
const VU = require('../lib/vector-utilities')

async function run(dbPath, query1, query2) {
  console.log(`Loading Vector Library from ${dbPath}`)
  let vecLib = new VectorLibraryReader()
  await vecLib.open(dbPath)
  console.log(`Loaded!`)
  console.log(`Running query for "${query1}" and "${query2}"...`)
  let results = await Promise.all([query1, query2].map((query => vecLib.lookup(query))))
  for (let result of results) {
    if (result) {
      console.log(`found a result for query...`)
    } else {
      console.log(`no result for query`)
    }
  }
  if (results.every(result => result !== null)) {
    let distance = VU.distanceSquared(results[0], results[1])
    console.log(`distance: ${distance}`)
  } else {
    console.log(`failures mean cannot assess distance`)
  }
}

let [db, query1, query2] = process.argv.slice(-3)
run(db, query1, query2)
