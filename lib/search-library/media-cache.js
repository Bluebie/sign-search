const fs = require('fs-extra')
const crypto = require('crypto')

// manages the video cache, culling unneeded files etc
class MediaCache {
  constructor(opts) {
    this.path = opts.path
    this.log = opts.log || console.log
    this.reset()
  }

  // reset the MediaCache to forget abotu what media it's seen, regarding the cleanup() method
  reset() { this.known = new Set() }

  hash(data) {
    let hash = crypto.createHash('sha256')
    hash.write(data)
    return hash.digest()
  }

  // caches a piece of media in to a format and returns the relative path to the encoded video
  // media must implement:
  //   async getKey() method which returns a string which can be used as a filename
  //   async getVideoPath() method which returns a promise resolving in a path to the video data on the local filesystem
  // optionally you may implement:
  //   async releaseVideoPath() method which releases the video path, indicating the source data can be garbage collected (unlinked)
  //   clipping: { start: float, end: float } - if this object exists, it's arguments are supplied to the encoder to clip out a piece of the source video file
  // format must implement:
  //   async encode(inputPath, outputPath, start?, end?)
  //     inputPath and outputPath are paths on the filesystem
  //     start and end are optional and maybe a time range in seconds to clip out of the source video
  //   getMediaInfo()
  //   encode must return a promise which resolves or rejects if the encode succeeds or fails
  // returns the path to the video cached on the filesystem
  async cache({ media, format }) {
    let formatInfo     = format.getMediaInfo()
    let outputFilename = `${await media.getKey()}${formatInfo.extension}`
    let shardID        = this.hash(outputFilename).toString('hex').slice(0, 2).toLowerCase()
    let encodePath     = `${this.path}/videos/${shardID}/partial-${outputFilename}`
    let videoPath      = `${this.path}/videos/${shardID}/${outputFilename}`
    this.known.add(outputFilename) // add to list of videos we shouldn't delete during @finish

    // ensure directories exist
    await fs.ensureDir(`${this.path}/videos/${shardID}`)

    if (!(await fs.pathExists(videoPath))) {
      this.log(`Output path: ${videoPath}`)
      let start = media.clipping && media.clipping.start
      let end = media.clipping && media.clipping.end
      
      let sourcePath = await media.getVideoPath()
      this.log("Encoding...")
      await format.encode(sourcePath, encodePath, start, end)
      this.log("Cached!")
      await fs.move(encodePath, videoPath)
      if (media.releaseVideoPath) await media.releaseVideoPath()
    }

    return videoPath
  }

  // remove any videos in the cache that weren't queried with @cache() in this session
  async cleanup() {
    for (let prefix of await fs.readdir(this.path)) {
      // skip things that aren't directories
      if (!(await fs.lstat(`${this.path}/${prefix}`)).isDirectory()) continue
      // check each video needs to be there (was the cache hit?)
      for (let videoFilename of (await fs.readdir(`${this.path}/${prefix}`))) {
        if (!this.known.has(videoFilename)) await fs.unlink(`${this.path}/${prefix}/${videoFilename}`)
      }
      // remove empty prefix directories
      if ((await fs.readdir(`${this.path}/${prefix}`)).length == 0) await fs.remove(`${this.path}/${prefix}`)
    }
  }
}

module.exports = MediaCache