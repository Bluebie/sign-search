// SearchLibrary setup by default with Web API's hooked up for read only search library access
const SearchLibrary = require('./library')
const crypto = require('crypto')
const fs = require('fs-extra')
const zlib = require('zlib')

class SearchLibraryNode extends SearchLibrary {
  constructor(config) {
    let defaultedConfig = Object.assign({
      fs,
      // brotli implementation works, but in testing it didn't compress better than gzip
      // brotli: (buffer)=> {
      //   let opts = {
      //     chunkSize: 64 * 1024,
      //     params: {
      //       [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
      //       [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length
      //     }
      //   }
      //   return new Promise((resolve, reject) => {
      //     zlib.gzip(buffer, opts, (err, result)=> {
      //       if (err) return reject(err)
      //       resolve(result)
      //     })
      //   });
      // },
      gzip: (buffer)=> {
        let opts = {
          level: 9,
          memLevel: 9,
          strategy: zlib.constants.Z_FILTERED
        }
        return new Promise((resolve, reject) => {
          zlib.gzip(buffer, opts, (err, result)=> {
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