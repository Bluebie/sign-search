// A test utility, queries the a vector library and retrieves the word
// embedding vector as a JSON array
// Usage:
//  > node query-vector-database.js ../datasets/vectors-name-of-library Search-Word
const VectorLibraryReader = require('../lib/vector-library/reader')

async function run(dbPath, query) {
  console.warn(`Loading Vector Library from ${dbPath}`)
  let vecLib = new VectorLibraryReader()
  await vecLib.open(dbPath)
  console.warn(`Loaded!`)
  console.warn(`Running query for "${query}"`)
  let result = await vecLib.lookup(query)
  if (result) {
    console.warn(`Found Vector!`)
    console.log(JSON.stringify(result))
  } else {
    console.warn(`Word not found in index`)
    process.exitCode = 1
  }
}

let [db, query] = process.argv.slice(-2)
run(db, query)
//run('datasets/vector-library', 'hello')
