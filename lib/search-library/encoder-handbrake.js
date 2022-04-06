// media encoder which uses Handbrake-CLI to encode videos
const hbjs = require('handbrake-js')

class HandbrakeEncoder {
  constructor (options = {}) {
    this.maxWidth = options.maxWidth || 512
    this.maxHeight = options.maxHeight || 288
    this.encoder = options.encoder || 'x264'
    this.format = options.format || 'av_mp4'
    this.quality = options.quality || 22.0
    this.type = options.type || {
      av_mp4: 'video/mp4',
      av_mkv: 'video/x-matroska',
      av_webm: 'video/webm'
    }[this.format]
    this.extension = options.extension || `-${this.maxWidth}x${this.maxHeight}-${this.encoder}.${{ av_mp4: 'mp4', av_mkv: 'mkv', av_webm: 'webm' }[this.format]}`
    this.log = options.log || console.log
    this.options = options
  }

  toString () {
    return `<HandbrakeEncoder ${this.maxWidth}x${this.maxHeight} ${this.encoder} ${this.format}>`
  }

  // return media info object, which is embedded in search index settings.mediaSets array to describe which encodes are available in the MediaCache
  getMediaInfo () {
    return {
      extension: this.extension,
      type: this.type,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight
    }
  }

  // returns a boolean: does this encoder support sources with this file extension? extension should be formatted ".mp4" for example
  accepts (extension) {
    if (!extension) return true
    return [
      '.mp4', '.m4v', '.mov', '.mpg', '.mpeg', '.mkv', '.webm', '.ogg', '.flv', '.ts'
    ].some(x => extension.toLowerCase().endsWith(x))
  }

  // async function returns a promise which resolves when encode succeeds
  encode (inputPath, outputPath, start, end) {
    return new Promise((resolve, reject) => {
      this.log(`Encoding video ${inputPath}`)

      const options = {
        input: inputPath,
        output: outputPath,
        format: this.format,
        encoder: this.encoder,
        'encoder-profile': this.options.encoderProfile || 'high',
        'encoder-level': this.options.encoderLevel || '4.1',
        maxWidth: this.maxWidth,
        maxHeight: this.maxHeight,
        quality: this.quality,
        hqdn3d: this.hqdn3d || 'strong',
        'keep-display-aspect': true,
        audio: 'none',
        'encoder-preset': this.options.encoderPreset || 'veryslow',
        optimize: true,
        'align-av': true
      }
      if (typeof (start) === 'number') options['start-at'] = `duration:${start}`
      if (typeof (end) === 'number') options['stop-at'] = `duration:${(end - start)}`
      if (this.options.twopass) options['2'] = true

      const progressFrequency = 2000
      let lastProgress = 0
      let lastPercent = ''
      hbjs.spawn(options).on('error', err => {
        // invalid user input, no video found etc
        reject(err)
      }).on('progress', progress => {
        if (Date.now() > lastProgress + progressFrequency && lastPercent !== progress.percentComplete) {
          this.log(`Encode progress: ${progress.percentComplete || 0}%, ETA: ${progress.eta}`)
          lastPercent = progress.percentComplete
          lastProgress = Date.now()
        }
      }).on('complete', () => resolve())
    })
  }
}

module.exports = HandbrakeEncoder
