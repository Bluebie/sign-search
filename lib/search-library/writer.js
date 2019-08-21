// Version 2 Search Library builder
// This class can only run in NodeJS type environments. It's used to build a sign library, which is a propritary (though open)
// format used to index search results in a compact format suitable for loading in to the browser front end for client side searching
// with lazy loading of search result details. It includes a tagging system, used here to create collections indicating which states
// of Australia an Auslan sign is used in.
const path = require('path')
const crypto = require('crypto')
const fs = require('fs-extra')
const VectorUtilities = require('../vector-utilities.js')
const hbjs = require('handbrake-js')

// tool to build a packet for the index file
const BuildPacket = {
  settings: (json)=> {
    let text = JSON.stringify(json)
    let buffer = Buffer.alloc(3 + Buffer.byteLength(text))
    buffer.writeUInt8(1, 0)
    buffer.writeUInt16BE(Buffer.byteLength(text), 1)
    buffer.write(text, 3)
    return buffer
  },

  clearTags: ()=> {
    return Buffer.from([2])
  },

  addTag: (label)=> {
    if (Buffer.byteLength(label) > 255) throw new Error(`Tag ${label} is too long!`)
    let buffer = Buffer.alloc(2 + Buffer.byteLength(label))
    buffer.writeUInt8(3, 0)
    buffer.writeUInt8(Buffer.byteLength(label), 1)
    buffer.write(label, 2)
    return buffer
  },

  setUnknownWords: (unknownWords)=> {
    let text = unknownWords.join("\0")
    let buffer = Buffer.alloc(3 + Buffer.byteLength(text))
    buffer.writeUInt8(4, 0)
    buffer.writeUInt16BE(Buffer.byteLength(text), 1)
    buffer.write(text, 3)
    return buffer
  },

  defineVector: (vectorData, definitions)=> {
    let buffer = Buffer.alloc(3)
    buffer.writeUInt8(5, 0)
    buffer.writeUInt16BE(definitions, 1)
    return Buffer.concat([buffer, vectorData])
  },

  nullVector: (definitions)=> {
    let buffer = Buffer.alloc(3)
    buffer.writeUInt8(6, 0)
    buffer.writeUInt16BE(definitions, 1)
    return buffer
  }
}




// default cache validator / importer
class VideoCacheDefaultChecker {
  constructor(videoFilePath) {
    this.path = videoFilePath
  }

  // simple implementation just sha1's the video's data from the local filesystem
  // returns a promise resolving with a suggested key that will change when the video's contents changes
  getKey() {
    return new Promise((resolve, reject) => {
      var videoDataStream = require('fs').createReadStream(this.path)
      var hash = crypto.createHash('sha1')
      
      // when video data is done writing in to hash, return the result
      videoDataStream.on('end', ()=> {
        hash.end()
        resolve(hash.read().toString('hex').toLowerCase())
      })
      
      // pipe the video in to the hash function
      videoDataStream.pipe(hash)
    })
  }

  async getVideoPath() {
    return this.path
  }

  async releaseVideoPath() {
    // null: we don't autodelete with this default behaviour
  }
}




// manages the video cache, culling unneeded files etc
class VideoCache {
  constructor(basePath, hashFunc, transcodeFunc) {
    this.path = basePath
    this.hash = hashFunc
    this.transcode = transcodeFunc
    this.reset()
  }

  reset() { this.known = [] }

  // give it a path to a video file, get back a cached (and possibly transcoded) video
  // or give it an object implenting getKey(), getVideoPath(), and releaseVideoPath(), to download things in a more dynamic as needed way
  async getCachePath(inputVideo, options = {}) {
    if (typeof(inputVideo) == 'string') {
      inputVideo = new VideoCacheDefaultChecker(inputVideo)
    }

    let videoFileName = `${await inputVideo.getKey()}.mp4`
    let prefix = this.hash(videoFileName).toString('hex').slice(0, 2).toLowerCase()
    let videoPath = `${this.path}/${prefix}/${videoFileName}`
    this.known.push(videoFileName) // add to list of videos we shouldn't delete during @finish

    // ensure directories exist
    if (!(await fs.pathExists(`${this.path}`))) await fs.mkdir(`${this.path}`)
    if (!(await fs.pathExists(`${this.path}/${prefix}`))) await fs.mkdir(`${this.path}/${prefix}`)

    if (!(await fs.pathExists(videoPath)) || options.force) {
      console.log("Video not yet encoded, fetching and encoding in to cache...")
      let start = inputVideo.clipping && inputVideo.clipping.start
      let end = inputVideo.clipping && inputVideo.clipping.end
      try {
        console.log("Getting video...")
        let rawVideoPath = await inputVideo.getVideoPath()
        console.log("Transcoding video in to cache...")
        await this.transcode(rawVideoPath, videoPath, start, end)
        console.log("Encoded video!")
        if (inputVideo.releaseVideoPath) await inputVideo.releaseVideoPath()
      } catch (err) {
        console.log(`Error occured! Deleting potential partial video encode from search library build...`)
        if (inputVideo.releaseVideoPath) await inputVideo.releaseVideoPath()
        if (await fs.pathExists(videoPath)) await fs.unlink(videoPath)
        throw err
      }
    }

    return videoPath
  }

  // remove any unused videos in the video cache
  async eraseUnused() {
    for (let prefix of await fs.readdir(this.path)) {
      // skip things that aren't directories
      if (!(await fs.lstat(`${this.path}/${prefix}`)).isDirectory()) continue
      // check each video needs to be there (was the cache hit?)
      for (let videoFileName of (await fs.readdir(`${this.path}/${prefix}`))) {
        if (!this.known.includes(videoFileName)) await fs.unlink(`${this.path}/${prefix}/${videoFileName}`)
      }
      // remove empty prefix directories
      if ((await fs.readdir(`${this.path}/${prefix}`)).length == 0) await fs.remove(`${this.path}/${prefix}`)
    }
  }
}





class SearchLibraryWriter {
  // accepts a path, e.g. datasets/Sign-Source-ID
  // settings can be:
  // {
  //   format: 'sint8', 'sint16' or 'float32',
  //   vectorSize: 300, (maybe useful for different vector databases in future?)
  //   scaling: 1.0, the maximum positive or negative number to represent in any vector - optional for float32 format
  //   hashFunction: 'sha1', 'sha256', 'sha384', or 'sha512'
  //   includeUnknownWords: false or true, should we write in any words the vectorDB fails to embed, or just ignore them?
  //   forceRedownloadChance: 0.0, a number between 0 and 1, indicating how likely any video is to randomly be re-downloaded
  //                               and encoded regardless of the cache status - to help maintain videos in high quality with
  //                               recent transcoding and correct any corruption
  //   vectorDB: provide a vector database reader that implements lookup(word string)
  //             returning a promise resolving to an array of floats vectorSize large
  // }
  constructor(basePath, settings = {}) {
    if (!settings.vectorDB) throw new Error("vectorDB must be provided in settings")
    this.includeUnknownWords = settings.includeUnknownWords || true
    this.vectorDB = settings.vectorDB
    this.redownloadChance = settings.forceRedownloadChance || 0.0

    this.settings = {
      version: 2,
      format: settings.format || 'sint16',
      vectorSize: settings.vectorSize || 300,
      scaling: settings.scaling || 1.0,
      hashFunction: settings.hashFunction || 'sha1',
    }

    // entries to write, keyed by tag list
    this.entries = {}
    this.stats = { unknownWords: 0, vectors: 0, total: 0 } // TODO: implement this thingie

    this.paths = {
      base: path,
      index:   `${basePath}/index.bin`,
      defs:    `${basePath}/defs`,
      defsTmp: `${basePath}/defs-rebuild`,
      videos:  `${basePath}/videos`
    }

    // setup the video cache system
    // you can set a video encode function to do some transcoding as needed during the build, or you can just let it copy by default
    let defaultVideoEncodeFunction = function(inputPath, outputPath, start, end) {
      return new Promise((resolve, reject) => {
        console.log(`Encoding video ${inputPath}`)

        let options = {
          "input": inputPath,
          "output": outputPath,
          "format": 'av_mp4',
          "encoder": 'x264',
          "encoder-profile": "high",
          "encoder-level": "4.1",
          "maxWidth": 512,
          "maxHeight": 288,
          "quality": 22,
          "hqdn3d": 'strong',
          "keep-display-aspect": true,
          "audio": 'none',
          "encoder-preset": 'veryslow',
          "optimize": true,
          "align-av": true
        }
        if (typeof(start) == 'number') options['start-at'] = `duration:${start}`
        if (typeof(end) == 'number') options['stop-at'] = `duration:${(end - start)}`

        let progressFrequency = 2000
        let lastProgress = 0
        let lastPercent = ''
        hbjs.spawn(options).on('error', err => {
          // invalid user input, no video found etc
          reject(err)
        }).on('progress', progress => {
          if (Date.now() > lastProgress + progressFrequency && lastPercent != progress.percentComplete) {
            console.log(`Percent complete: ${progress.percentComplete}, ETA: ${progress.eta}`)
            lastPercent = progress.percentComplete
            lastProgress = Date.now()
          }
        }).on('complete', ()=> resolve())
      })
    }

    let videoEncodeFunction = settings.videoEncodeFunction || defaultVideoEncodeFunction
    this.videos = new VideoCache(this.paths.videos, (data)=> this.hash(data), videoEncodeFunction)
  }

  // erase the defs, start fresh
  async open() {
    try { await fs.remove(this.paths.defsTmp) } catch {}
    this.settings.buildTimestamp = Date.now()
    return this
  }

  // write a definition to the sign storage
  // provided an object containing words, tags, def, and videoPaths
  // words is an array of strings or arrays, any subarrays have vectors added together to generate combined meaning
  // tags becomes hashtags in the dataset, allowing tag searching on the front end
  // def is a JSON object which will be written in to storage and is the data provided to the front end for user display, can be arbitrary, though 'variations' property is reserved
  // videoPaths is an array of local filesystem paths pointing to video files that can be encoded, or it is an array of objects which respond to the VideoCacheDefaultChecker interface which can fetch and provide local videos as needed when cache requires them
  // async function resolves promise when everything is encoded or cached, and ready
  // Note, this isn't threadsafe, so use it sequentially (don't call append again before the last append resolves)
  async append({words, tags: unfilteredTags, def, videoPaths}) {
    let tags = (unfilteredTags || []).filter((x)=> `${x}`.trim().length > 0)
    let tagList = tags.join("|")
    // establish tag group in storage
    if (!this.entries[tagList]) this.entries[tagList] = []

    let unknownWords = []

    let vectors = []
    // lookup our word vectors
    for (let wordsSubset of words) {
      let wordParts = typeof(wordsSubset) == 'string' ? [wordsSubset] : [...wordsSubset]
      let wordPartVectors = []
      for (let wordPart of wordParts) {
        let wordVector = await this.vectorDB.lookup(wordPart)
        if (!wordVector) wordVector = await this.vectorDB.lookup(wordPart.toLowerCase()) // try lower-case?
        wordPartVectors.push(wordVector)
      }
      if (wordPartVectors.every((x)=> x !== null)) {
        // every word part vectorized correctly, yay! add them together!
        let added = VectorUtilities.add(wordPartVectors)[0]
        vectors.push(added)
      } else {
        // oof, something didn't vectorize, this turns in to an unknown word
        unknownWords.push(wordParts.join(' '))
      }
    }

    let vector = null
    // average the word vectors in to one overall meaning
    if (vectors.length > 0) vector = VectorUtilities.mean(...vectors)
    // calculate this entries URL identifier by either hashing the vector or failing that, the unknown word list
    let identifier = this.hash(vector ? this.compressVector(vector) : unknownWords.join("\0")).toString('hex').toLowerCase()
    let prefix = identifier.slice(0, 2)

    if (!this.entries[tagList][identifier]) this.entries[tagList][identifier] = { unknownWords: [], vector: null, definitions: 0 }
    let nextID = this.entries[tagList][identifier].definitions // used for filenames

    this.entries[tagList][identifier].unknownWords.push(... unknownWords)
    this.entries[tagList][identifier].vector = vector

    // make sure directories exist
    if (!(await fs.pathExists(`${this.paths.defsTmp}`))) await fs.mkdir(`${this.paths.defsTmp}`)
    if (!(await fs.pathExists(`${this.paths.defsTmp}/${prefix}`))) await fs.mkdir(`${this.paths.defsTmp}/${prefix}`)
    if (!(await fs.pathExists(`${this.paths.defsTmp}/${prefix}/${identifier}`))) await fs.mkdir(`${this.paths.defsTmp}/${prefix}/${identifier}`)
    let defPath = `${this.paths.defsTmp}/${prefix}/${identifier}`
    
    // write out the videos first
    let videoID = 0
    for (let videoPath of videoPaths) {
      let cachePath = path.resolve(await this.videos.getCachePath(videoPath, {force: this.redownloadChance > Math.random()}))
      let linkPath = path.resolve(`${defPath}/definition-${nextID}-video-${videoID}.mp4`)
      if (await fs.pathExists(linkPath)) {
        await fs.unlink(linkPath)
      }
      
      await fs.symlink(path.relative(path.dirname(linkPath), cachePath), linkPath)
      videoID += 1
    }

    // write out the definition file, including number of videos in the 'variations' field
    this.entries[tagList][identifier].definitions += 1
    await fs.writeFile(`${defPath}/definition-${nextID}.json`, JSON.stringify({
      buildTimestamp: this.settings.buildTimestamp,
      variations: videoPaths.length,
      data: def
    }))
  }



  // must be called after all appends are finished, to finalise build
  async finish() {
    let indexData = []

    // write settings block
    indexData.push(BuildPacket.settings(this.settings))

    // iterate tag groups (it automatically bucket sorts them for us! yay!)
    for (let tagList of Object.keys(this.entries)) {
      if (tagList.toString() != "") {
        let tags = tagList.split("|")
        
        // write a tag list setup sequence of packets
        indexData.push(BuildPacket.clearTags())
        for (let tag of tags) {
          indexData.push(BuildPacket.addTag(tag))
        }
      }

      // write entries for this block
      for (let entry of Object.values(this.entries[tagList])) {
        // optional: write an unknown words block
        if (entry.unknownWords.length > 0 && this.includeUnknownWords) {
          indexData.push(BuildPacket.setUnknownWords(entry.unknownWords))
        }

        // write the vector or a no-vector block if necessary
        if (entry.vector) {
          indexData.push(BuildPacket.defineVector(this.compressVector(entry.vector), entry.definitions))
        } else if (entry.unknownWords.length > 0 && this.includeUnknownWords) {
          indexData.push(BuildPacket.nullVector(entry.definitions))
        }
      }
    }
    
    // write index file if index data changed
    let indexDataBlob = Buffer.concat(indexData)
    let oldIndexBlob = (await fs.pathExists(this.paths.index)) ? await fs.readFile(this.paths.index) : Buffer.from([])
    if (Buffer.compare(indexDataBlob, oldIndexBlob) !== 0) {
      await fs.writeFile(this.paths.index, indexDataBlob) // only rewrite if contents changed, to preserve downstream caches
    }

    // move definitions in to place
    if (await fs.pathExists(this.paths.defs)) await fs.rename(this.paths.defs, `${this.paths.defs}-trash`)
    await fs.rename(this.paths.defsTmp, this.paths.defs)

    // erase old trash defs directory
    if (await fs.pathExists(`${this.paths.defs}-trash`)) await fs.remove(`${this.paths.defs}-trash`)

    // remove unused video encodes
    await this.videos.eraseUnused()
  }


  // hash function, used internally
  hash(data) {
    let hash = crypto.createHash(this.settings.hashFunction)
    hash.write(data)
    return hash.digest()
  }

  // convert a vector in to a buffer in the format specified in settings
  compressVector(vector) {
    let vectorByteSize = {sint8: 1, sint16: 2, float32: 4}[this.settings.format]
    let vectorBuf = Buffer.alloc(this.settings.vectorSize * vectorByteSize)
    if (this.settings.format == 'sint8') {
      for (let i = 0; i < this.settings.vectorSize; i++) vectorBuf.writeInt8(Math.round(vector[i] * 127 / this.settings.scaling), (i * vectorByteSize))
    } else if (this.settings.format == 'sint16') {
      for (let i = 0; i < this.settings.vectorSize; i++) vectorBuf.writeInt16BE(Math.round(vector[i] * 32767 / this.settings.scaling), (i * vectorByteSize))
    } else if (this.settings.format == 'float32') {
      for (let i = 0; i < this.settings.vectorSize; i++) vectorBuf.writeFloatBE(vector[i] / this.settings.scaling, (i * vectorByteSize))
    }
    return vectorBuf
  }
}

module.exports = SearchLibraryWriter