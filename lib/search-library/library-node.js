// SearchLibrary setup by default with Web API's hooked up for read only search library access
const SearchLibrary = require('./library')
const crypto = require('crypto')
const fs = require('fs-extra')
const zlib = require('zlib')

class SearchLibraryNode extends SearchLibrary {
  constructor(config) {
    let defaultedConfig = Object.assign({
      fs,
      gzip: (buffer)=> {
        return new Promise((resolve, reject) => {
          zlib.gzip(buffer, (err, result)=> {
            if (err) return reject(err)
            resolve(result)
          })
        });
      }
    }, config)
    super(defaultedConfig)
  }
}

module.exports = SearchLibraryNode