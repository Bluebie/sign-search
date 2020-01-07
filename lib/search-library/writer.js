// Version 2 Search Library builder
// This class can only run in NodeJS type environments. It's used to build a sign library, which is a propritary (though open)
// format used to index search results in a compact format suitable for loading in to the browser front end for client side searching
// with lazy loading of search result details. It includes a tagging system, used here to create collections indicating which states
// of Australia an Auslan sign is used in.
const path = require('path')
const crypto = require('crypto')
const fs = require('fs-extra')
const zlib = require('zlib')
const util = require('util')
const VectorUtilities = require('../vector-utilities.js')
SearchLibraryReader = require('./reader.js')
const hbjs = require('handbrake-js')

// tool to build a packet for the index file
const BuildPacket = {
  // type 0: settings json blob
  settings: (json)=> {
    let text = JSON.stringify(json)
    let buffer = Buffer.alloc(3 + Buffer.byteLength(text))
    buffer.writeUInt8(0, 0)
    buffer.writeUInt16BE(Buffer.byteLength(text), 1)
    buffer.write(text, 3)
    return buffer
  },

  // type 1: establish word vector symbol (16bit symbols)
  establishVectorSymbol: (symbolID, symbolVectorData)=> {
    let header = Buffer.alloc(3)
    header.writeUInt8(1, 0)
    header.writeUInt16BE(symbolID, 1)
    return Buffer.concat([header, symbolVectorData])
  },

  // type 2: establish string symbol (16bit symbols)
  establishStringSymbol: (symbolID, symbolString)=> {
    if (Buffer.byteLength(symbolString) > 255) throw new Error(`Cannot establish unknown word string of length ${Buffer.byteLength(symbolString)}`)
    let header = Buffer.alloc(4)
    header.writeUInt8(2, 0)
    header.writeUInt16BE(symbolID, 1)
    header.writeUInt8(Buffer.byteLength(symbolString), 3)
    return Buffer.concat([header, Buffer.from(symbolString)])
  },

  // type 3: set tag list (16bit symbols)
  setTagList: (symbols)=> {
    let buffer = Buffer.alloc(2 + (symbols.length * 2))
    buffer.writeUInt8(3, 0)
    buffer.writeUInt8(symbols.length, 1)
    symbols.forEach((symbolID, idx)=> buffer.writeUInt16BE(symbolID, 2 + (idx * 2)))
    return buffer
  },

  // type 4: define search result (16bit symbols)
  defineSearchResult: (symbols, definitions)=> {
    let buffer = Buffer.alloc(3 + (symbols.length * 2))
    buffer.writeUInt8(4, 0) // packet type
    buffer.writeUInt8(symbols.length, 1)
    buffer.writeUInt8(definitions, 2)
    symbols.forEach((symbol, index)=> buffer.writeUInt16BE(symbol, 3 + (index * 2)))
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
  constructor(basePath, hashFunc, encoders) {
    this.path = basePath
    this.hash = hashFunc
    this.encoders = encoders
    this.reset()
  }

  reset() { this.known = [] }

  // get an object containing extensions as keys and paths as values for every encoder available
  async getCachePaths(inputVideo, options = {}) {
    let results = {}
    for (let encoder of this.encoders) {
      results[encoder.extension] = await this.getCachePath(inputVideo, {encoder})
    }
    return results
  }

  // give it a path to a video file, get back a cached (and possibly transcoded) video
  // or give it an object implenting getKey(), getVideoPath(), and releaseVideoPath(), to download things in a more dynamic as needed way
  async getCachePath(inputVideo, options = {}) {
    let encoder = options.encoder || this.encoders[0]
    if (typeof(inputVideo) == 'string') {
      inputVideo = new VideoCacheDefaultChecker(inputVideo)
    }

    let videoFileName = `${await inputVideo.getKey()}${encoder.extension || '.mp4'}`
    let prefix = this.hash(videoFileName).toString('hex').slice(0, 2).toLowerCase()
    let videoPath = `${this.path}/${prefix}/${videoFileName}`
    let tempVideoPath = `${this.path}/${prefix}/encoding-video-${videoFileName}`
    this.known.push(videoFileName) // add to list of videos we shouldn't delete during @finish

    // ensure directories exist
    await fs.ensureDir(`${this.path}/${prefix}`)

    if (!(await fs.pathExists(videoPath)) || options.force) {
      console.log("Video not yet encoded, fetching and encoding in to cache...")
      let start = inputVideo.clipping && inputVideo.clipping.start
      let end = inputVideo.clipping && inputVideo.clipping.end
      try {
        console.log("Getting video...")
        let rawVideoPath = await inputVideo.getVideoPath()
        console.log("Transcoding video in to cache...")
        await encoder.encode(rawVideoPath, tempVideoPath, start, end)
        console.log("Encoded video!")
        await fs.move(tempVideoPath, videoPath)
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


class HandbrakeEncoder {
  constructor(options = {}) {
    this.maxWidth = options.maxWidth || 512
    this.maxHeight = options.maxHeight || 288
    this.encoder = options.encoder || 'x264'
    this.format = options.format || 'av_mp4'
    this.quality = options.quality || 22.0
    this.type = options.type || {av_mp4: 'video/mp4', av_mkv: 'video/x-matroska'}[this.format]
    this.extension = options.extension || `-${this.maxWidth}x${this.maxHeight}-${this.encoder}.${{av_mp4: 'mp4', av_mkv: 'mkv'}[this.format]}`
    this.options = options
  }

  // async function returns a promise which resolves when encode succeeds
  encode(inputPath, outputPath, start, end) {
    return new Promise((resolve, reject) => {
      console.log(`Encoding video ${inputPath}`)

      let options = {
        "input": inputPath,
        "output": outputPath,
        "format": this.format,
        "encoder": this.encoder,
        "encoder-profile": this.options.encoderProfile || "high",
        "encoder-level": this.options.encoderLevel || "4.1",
        "maxWidth": this.maxWidth,
        "maxHeight": this.maxHeight,
        "quality": this.quality,
        "hqdn3d": this.hqdn3d || 'strong',
        "keep-display-aspect": true,
        "audio": 'none',
        "encoder-preset": this.options.encoderPreset || 'veryslow',
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
          console.log(`Encode Percent complete: ${progress.percentComplete}, ETA: ${progress.eta}`)
          lastPercent = progress.percentComplete
          lastProgress = Date.now()
        }
      }).on('complete', ()=> resolve())
    })
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

    this.nibbleBinaryTable = {};
    (new Array(16)).fill(0).forEach((_, idx) => {
      this.nibbleBinaryTable[idx.toString(16).toLowerCase()] = ('0000' + idx.toString(2)).slice(-4)
    })

    this.settings = {
      version: 3,
      format: settings.format || 'sint16',
      vectorSize: settings.vectorSize || 300,
      scaling: settings.scaling || 1.0,
      hashFunction: settings.hashFunction || 'sha1',
      buildTimestamp: settings.buildTimestamp || Date.now(),
      vectorLibrary: this.vectorDB.name,
      shardBits: settings.shardBits || 8,
      mediaSets: [],
      buildID: settings.buildID,
      gzip: settings.gzip || true // TODO: Implement static gzipping in version 3 for def files
    }
    if (this.settings.buildID === undefined) this.settings.buildID = Math.floor(this.settings.buildTimestamp).toString(36)
    this.keepRecentBuilds = settings.keepRecentBuilds || 2 // how many recent builds to leave defs for

    this.stats = { unknownWords: 0, vectors: 0, total: 0 } // TODO: implement this thingie

    this.paths = {
      base:     basePath,
      index:    `${basePath}/index.bin`,
      defsBase: `${basePath}/defs`,
      defs:     `${basePath}/defs/${this.settings.buildID}`,
      videos:   `${basePath}/videos`
    }

    // setup the video cache system
    this.encoders = settings.encoders || [new HandbrakeEncoder]
    for (let encoder of this.encoders) {
      this.settings.mediaSets.push({extension: encoder.extension, type: encoder.type, maxWidth: encoder.maxWidth, maxHeight: encoder.maxHeight})
    }

    this.videos = new VideoCache(this.paths.videos, (data)=> this.hash(data), this.encoders)
  }

  // erase the defs, start fresh
  async open() {
    this.symbols = {}
    this.symbolsIndexData = []
    this.symbolPackets = []
    this.entries = {}
    // work out if the existing build is complete, and if it represents this buildID, and skip if it does
    this.skipBuild = false
    if ((await fs.pathExists(this.paths.defs)) && (await fs.pathExists(this.paths.index))) {
      let reader = new SearchLibraryReader()
      await reader.open(this.paths.basePath)
      if (reader.config.buildID == this.settings.buildID) this.skipBuild = true
    }
    if (this.skipBuild) console.log("This Search Library version already exists, skipping rebuild, no files will be written")
    return this
  }

  // convert a string or vector array (array of usually 300 floats) to a symbol number
  symbol(input) {
    if (typeof(input) == 'string') {
      if (this.symbols[input]) return this.symbols[input]
      let index = this.symbols[input] = this.symbolsIndexData.length
      this.symbolsIndexData.push(Buffer.from(input))
      this.symbolPackets.push(BuildPacket.establishStringSymbol(index, input))
      return index
    } else if (input.constructor == Array || input.constructor == Float32Array) {
      let vectorData = this.compressVector(input)
      let key = vectorData.toString('hex')
      if (this.symbols[key]) return this.symbols[key]
      let index = this.symbols[key] = this.symbolsIndexData.length
      this.symbolsIndexData.push(vectorData)
      this.symbolPackets.push(BuildPacket.establishVectorSymbol(index, vectorData))
      return index
    } else {
      throw new Error(`Tried to symbol unsupported input type ${input.constructor}`)
    }
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
    if (this.skipBuild) return
    let tags = (unfilteredTags || []).filter((x)=> `${x}`.trim().length > 0)
    let tagSymbols = tags.map(string => this.symbol(string))
    let tagList = tagSymbols.join(",")

    let symbolList = []
    for (let word of words.flat()) {
      let cleanedWord = word.trim().replace(/‘/g, "'")
      // if it's not all caps like an acronym, lowercase it
      if (cleanedWord.match(/[a-z]/) || cleanedWord.length < 2) cleanedWord = cleanedWord.toLowerCase()
      let vector = await this.vectorDB.lookup(cleanedWord)
      if (!vector) vector = await this.vectorDB.lookup(cleanedWord.toLowerCase()) // try lowercase even if it seems like an acronym?

      // add symbol for this word to the symbol list, generating symbols as needed
      symbolList.push(this.symbol(vector || cleanedWord))
    }

    let identifier = this.hash(Buffer.concat([...tagSymbols, ...symbolList].map(symID => this.symbolsIndexData[symID]))).toString('hex').toLowerCase()
    let prefix = identifier.slice(0, Math.ceil(this.settings.shardBits / 4))
    let shardID = parseInt(prefix.split('').map(nibble => this.nibbleBinaryTable[nibble.toLowerCase()]).join('').slice(0, this.settings.shardBits), 2)
    
    if (!this.entries[tagList]) this.entries[tagList] = []
    let entry = this.entries[tagList][identifier]
    if (!entry) entry = this.entries[tagList][identifier] = { symbols: symbolList, definitions: 0 }
    
    // write out the videos first
    let media = []
    for (let videoPath of videoPaths) {
      let cachePaths = await this.videos.getCachePaths(videoPath, {force: this.redownloadChance > Math.random()})
      let variationData = {}
      for (let ext of Object.keys(cachePaths)) {
        let relativeMediaPath = path.relative(this.paths.base, path.resolve(cachePaths[ext]))
        variationData[ext] = relativeMediaPath
      }
      media.push(variationData)
    }

    // write out the definition file, including number of videos in the 'variations' field
    entry.definitions += 1
    let json = {
      buildTimestamp: this.settings.buildTimestamp,
      media,
      data: def
    }

    let definitionFilePath = `${this.paths.defs}/${shardID}.json`
    let existingDefinitions = {}
    await fs.ensureDir(this.paths.defs)
    if (await fs.pathExists(definitionFilePath)) {
      existingDefinitions = await fs.readJSON(definitionFilePath)
    }
    if (!existingDefinitions[identifier]) existingDefinitions[identifier] = []
    existingDefinitions[identifier].push(json)
    await fs.writeJSON(definitionFilePath, existingDefinitions)
  }



  // must be called after all appends are finished, to finalise build
  async finish() {
    if (this.skipBuild) return
    // write out the settings block and symbol definitions
    let indexData = [BuildPacket.settings(this.settings), ...this.symbolPackets]

    // iterate tag groups
    for (let tagList of Object.keys(this.entries)) {
      let tags = tagList.split(",").map(num => parseInt(num))
      indexData.push(BuildPacket.setTagList(tags))

      // write entries for this block
      for (let entry of Object.values(this.entries[tagList])) {
        indexData.push(BuildPacket.defineSearchResult(entry.symbols, entry.definitions))
      }
    }
    
    // write index file if index data changed
    let rawIndexDataBlob = Buffer.concat(indexData)
    if (this.settings.gzip) {
      let indexDataBlob = await util.promisify(zlib.gzip)(rawIndexDataBlob, { level: 9 })
      await fs.writeFile(`${this.paths.index}.gz`, indexDataBlob)
    } else {
      await fs.remove(`${this.paths.index}.gz`)
    }
    await fs.writeFile(`${this.paths.index}`, rawIndexDataBlob)

    // check what builds exist, find their modification times in filesystem, sort so most recent are at top of list
    let dirList = await fs.readdir(this.paths.defsBase)
    let buildFolders = await Promise.all(dirList.map(fn =>
      fs.stat(`${this.paths.defsBase}/${fn}`)
      .then(x => ({path: `${this.paths.defsBase}/${fn}`, mtime: x.mtimeMs}))
    ))
    let recentFolders = buildFolders.sort((a,b)=> b.mtime - a.mtime)

    // gzip the json def files
    let defFiles = (await fs.readdir(this.paths.defs)).filter(x => x.match(/.json$/))
    let defPaths = defFiles.map(x => `${this.paths.defs}/${x}`)
    for (let defPath of defPaths) {
      let uncompressedData = await fs.readFile(defPath)
      let compressedData = await util.promisify(zlib.gzip)(uncompressedData, { level: 9 })
      if (compressedData.byteLength < uncompressedData.byteLength) {
        await fs.writeFile(`${defPath}.gz`, compressedData)
      }
    }

    // remove every build older than the number of builds to keep
    for (let build of recentFolders.slice(this.keepRecentBuilds)) { // slice off any extra folders and recursively remove them
      await fs.remove(build.path)
    }

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