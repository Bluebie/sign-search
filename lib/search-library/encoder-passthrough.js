// media encoder which doesn't encode anything, it just passes through the original data unchanged
const fs = require('fs-extra')

class PassthroughEncoder {
  constructor(options = {}) {
    this.extension = options.extension || '-source.mp4'
    this.type = options.type || 'video/mp4'
    this.log = options.log || console.log
  }

  // return media info object, which is embedded in search index settings.mediaSets array to describe which encodes are available in the MediaCache
  getMediaInfo() {
    return {
      extension: this.extension,
      type: this.type,
      maxWidth: Infinity,
      maxHeight: Infinity
    }
  }

  // returns a boolean: does this encoder support sources with this file extension? extension should be formatted ".mp4" for example
  accepts(extension) {
    if (!extension) return true
    return this.extension.toLowerCase().endsWith(extension.toLowerCase())
  }

  // async function returns a promise which resolves when encode succeeds
  encode(inputPath, outputPath, start, end) {
    return fs.copyFile(inputPath, outputPath)
  }
}

module.exports = PassthroughEncoder