// SearchLibrary setup by default with Web API's hooked up for read only search library access
const SearchLibrary = require('./library')
const fsutil = require('../util')

class SearchLibraryWeb extends SearchLibrary {
  constructor(config) {
    super({
      fs: { readFile: fsutil.fetchLikeFile },
      ...config
    })
  }
}

module.exports = SearchLibraryWeb