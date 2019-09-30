// Simple way to read the settings block and see how many entries are in an already built Search Library
const SearchLibraryReader = require('../lib/search-library/reader')

async function run(dbPath) {
  let searchLib = await new SearchLibraryReader().open(dbPath)
  console.warn(`Settings block from Search Library:`)
  console.log(searchLib.settings)

  console.warn(`Search Index contains ${searchLib.searchIndex.length} entries`)
}

let [db] = process.argv.slice(-1)
run(db)
