// Simple way to read the settings block and see how many entries are in an already built Search Library
// const SearchLibraryReader = require('../lib/search-library/reader')

// async function run(dbPath) {
//   let searchLib = await new SearchLibraryReader().open(dbPath)
//   console.warn(`Settings block from Search Library:`)
//   console.log(searchLib.settings)

//   console.warn(`Search Index contains ${searchLib.searchIndex.length} entries`)
// }

const SearchLibrary = require('../lib/search-library/library-node')

async function run(dbPath) {
  let lib = new SearchLibrary({
    path: dbPath
  })
  
  await lib.open()

  console.log(lib.settings)
  console.warn(`Search Index contains ${lib.index.length} entries`)
}

let [db] = process.argv.slice(-1)
run(db)
