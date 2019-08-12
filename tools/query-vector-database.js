const VectorLibraryReader = require('../lib/vector-library/vector-library-reader')

async function run(dbPath, query) {
  console.log(`Loading Vector Library from ${dbPath}`)
  let vecLib = new VectorLibraryReader()
  await vecLib.open(dbPath)
  console.log(`Loaded!`)
  console.log(`Running query for "${query}"`)
  let result = await vecLib.lookup(query)
  if (result) {
    console.log(`Found Vector!`, result)
  } else {
    console.log(`Word not found in index`)
  }
}

let [db, query] = process.argv.slice(-2)
run(db, query)
//run('datasets/vector-library', 'hello')
