// media encoder which uses ffmpeg to encode videos
// defaults to producing webp animations
// Not in use, because the output is huge and looks like trash
// Currently untested
const { spawn } = require('child_process')
const byline = require('byline')
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

class FFMPEGEncoder {
  constructor(options = {}) {
    this.maxWidth = options.maxWidth || 512
    this.maxHeight = options.maxHeight || 288
    this.encoder = options.encoder || 'libwebp'
    this.quality = options.quality || 90
    this.type = options.type || {libwebp: 'image/webp', x264: 'video/mp4'}[this.encoder]
    this.extension = options.extension || `-${this.maxWidth}x${this.maxHeight}-${this.encoder}.${{x264: 'mp4', libwebp: 'webp'}[this.encoder]}`
    this.log = options.log || console.log
    this.options = options
  }

  toString() {
    return `<FFMPEGEncoder ${this.maxWidth}x${this.maxHeight} ${this.encoder}>`
  }

  // return media info object, which is embedded in search index settings.mediaSets array to describe which encodes are available in the MediaCache
  getMediaInfo() {
    return {
      extension: this.extension,
      type: this.type,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight
    }
  }

  // returns a boolean: does this encoder support sources with this file extension? extension should be formatted ".mp4" for example
  accepts(extension) {
    if (!extension) return true
    return [
      '.mp4', '.m4v', '.mov', '.mpg', '.mpeg', '.mkv', '.webm', '.ogg', '.flv', '.ts'
    ].some(x => extension.toLowerCase().endsWith(x))
  }

  // async function returns a promise which resolves when encode succeeds
  async encode(inputPath, outputPath, start, end) {
    this.log(`Encoding video ${inputPath}`)

    // ffmpeg -i input.mov -vcodec libwebp -lossless 1 -q:60 -preset default -loop 0 -an -vsync 0 output.webp
    let args = [
      '-i', inputPath,
      '-vf', `scale=w=min(iw,${this.maxWidth}):h=min(ih,${this.maxHeight}):force_original_aspect_ratio=decrease`,
      '-vcodec', this.encoder,
      '-compression_level', '6',
      '-preset', 'default',
      '-qscale', this.quality,
      outputPath
    ].flat()
    let ffmpeg = spawn('ffmpeg', args)
    let ffmpegExitCode = new Promise((resolve, reject) => {
      ffmpeg.on('exit', (code) => {
        if (code && code != 0) reject(`ffmpeg child process exited with error ${code}`)
        else resolve()
      })
    })
    let linesOutput = byline.createStream(ffmpeg.stderr)
    for await (let line of linesOutput) {
      this.log(line)
    }

    return await ffmpegExitCode
  }
}

module.exports = FFMPEGEncoder