// SearchLibrary setup by default with Web API's hooked up for read only search library access
const SearchLibrary = require('./library')
const fs = require('fs-extra')
const zlib = require('zlib')

class SearchLibraryNode extends SearchLibrary {
  constructor (config) {
    const defaultedConfig = Object.assign({
      fs,
      gzip: (buffer) => {
        const opts = {
          level: 9,
          memLevel: 9,
          strategy: zlib.constants.Z_FILTERED
        }
        return new Promise((resolve, reject) => {
          zlib.gzip(buffer, opts, (err, result) => {
            if (err) return reject(err)
            resolve(result)
          })
        })
      }
    }, config)
    super(defaultedConfig)
  }
}

module.exports = SearchLibraryNode
