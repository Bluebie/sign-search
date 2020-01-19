// read in second generation "packet stream" style search library format, and provide access to all it's resources
const Util = require('../util')
const VU = require('../vector-utilities')
const SearchResultDefinition = require('./result-definition')

let PacketDecoder = [
  // type 0: settings block
  // uint8  packet type
  // uint16 JSON string length
  // blob   json in utf8 bytes
  (dataview, settings)=> ({
    type: 'settings',
    length: 3 + dataview.getUint16(1),
    data: JSON.parse(PacketDecoder.stringFromPosition(dataview, 3, dataview.getUint16(1)))
  }),

  // type 1: establish word vector symbol (16bit symbols)
  // uint8  packet type
  // uint16 symbol index
  // blob   vector data
  (dataview, settings)=> ({
    type: 'establish vector symbol',
    length: 3 + PacketDecoder.vectorByteSize(settings),
    data: {
      symbolIndex: dataview.getUint16(1),
      vector: PacketDecoder.decodeVector(dataview, settings, 3),
      indexBytes: PacketDecoder.sliceSection(dataview, 3, PacketDecoder.vectorByteSize(settings))
    }
  }),

  // type 2: establish string symbol (16bit symbols)
  // uint8  packet type
  // uint16 symbol index
  // uint8  symbol string length
  // utf8   symbol string value
  (dataview, settings)=> ({
    type: 'establish string symbol',
    length: 4 + dataview.getUint8(3),
    data: {
      symbolIndex: dataview.getUint16(1),
      string: PacketDecoder.stringFromPosition(dataview, 4, dataview.getUint8(3)),
      indexBytes: PacketDecoder.sliceSection(dataview, 4, dataview.getUint8(3))
    }
  }),

  // type 3: set tag list to string symbols (16bit)
  // uint8  packet type (always 10)
  // uint8  symbol count (how many tags?)
  // uint16[] symbol IDs (referencing established string symbols)
  (dataview, settings)=> ({
    type: 'set tag list',
    length: 2 + (dataview.getUint8(1) * 2),
    data: { symbols: Array(dataview.getUint8(1)).fill().map((_,i) => dataview.getUint16(2 + (i * 2))) }
  }),

  // type 4: define search result (16bit symbols)
  // uint8  packet type
  // uint8  number of symbols
  // uint8  number of definitions stored to this search result
  // uint16[] symbol IDs (referencing vectors and unknown plaintext words, but not tags)
  (dataview, settings)=> ({
    type: 'define search result',
    length: 3 + (dataview.getUint8(1) * 2),
    data: {
      definitions: dataview.getUint8(2),
      symbols: Array(dataview.getUint8(1)).fill().map((_,i) => dataview.getUint16(3 + (i * 2)))
    }
  })
]

// helper function that reads in a compressed word vector and converts it to a standard array of floats
PacketDecoder.decodeVector = function(dataview, settings, offset) {
  let vectorNumSize = ({sint8: 1, sint16: 2, float32: 4}[settings.format])

  let getter = ({sint8: 'getInt8', sint16: 'getInt16', float32: 'getFloat32'})[settings.format]
  let maxVal = ({sint8: 127, sint16: 32767, float32: 1.0})[settings.format]
  let vector = []
  for (let i = 0; i < settings.vectorSize; i++) {
    vector[i] = dataview[getter].call(dataview, offset + (i * vectorNumSize)) / maxVal * settings.scaling
  }

  return vector
}

// helper function that calculates how many bytes a whole word vector will be in compressed storage
PacketDecoder.vectorByteSize = function(settings) {
  return settings.vectorSize * ({sint8: 1, sint16: 2, float32: 4}[settings.format])
}

// slice a section of the databuffer in to a Uint8Array and return it
PacketDecoder.sliceSection = function(dataview, start, length) {
  //return dataview.buffer.slice(dataview.byteOffset + start, dataview.byteOffset + start + length)
  return new Uint8Array(dataview.buffer, dataview.byteOffset + start, length)
}

// read a UTF-8 string of known length out of the buffer and return a regular javascript string
PacketDecoder.stringFromPosition = function(dataview, start, length) {
  return (new TextDecoder()).decode(PacketDecoder.sliceSection(dataview, start, length))
}



// This object helps load and interpret the packet stream formatted search library index files
// These files represent every point of knowledge the search engine has for the requested dataset
// and provides an interface to query that dataset, with a ranked result where best matches return first
// as well as lazy loading in metadata like the plain text descriptions, the exact words in the definition
// and the video files demonstrating sign usage
// This is called the second generation format, but really it's more like the 4th generation, after a lot of
// experimentation, this packet-like format has been selected as an efficient way to compress a large dataset
// and offers enough flexibility to add new features in the future and further optimisation without making
// bad breaking changes to the stream. In the future it would even be possible to interpret the file as a stream
// instead of processing it after it's done downloading, shoud internet speeds get fast enough that such a change
// would bring any worthwhile value
class SearchLibraryReader {
  // create a new Vector Library Reader
  constructor() {
    this.isOpen = false
    this.settings = {}

    // detect if we're running on node-js or browser stack
    this._fetch = this._fetchWeb
    this._hash = this._hashWeb
    if (typeof process === 'object') {
      if (typeof process.versions === 'object') {
        if (typeof process.versions.node !== 'undefined') {
          this._fetch = this._fetchNodeJS
          this._hash = this._hashNodeJS
        }
      }
    }
  }

  // open a Vector Library at a certain url
  async open(url) {
    this.baseURL = url
    this.name = url.split('/').slice(-1)[0]

    // initialise the data store
    this.searchIndex = []

    // fetch the db index in to memory
    let indexData = await this._fetch(`${this.baseURL}/index.bin`)
    this.mtime = indexData.mtime

    // decoding state values
    let tags = []
    let symbols = []
    let symbolIndexBytes = []

    // code paths to handle each decoded packet type and update the state machine
    let packetHandlers = {
      "settings": async (data)=> this.settings = data,
      "establish vector symbol": async (data)=> {
        symbols[data.symbolIndex] = data.vector
        symbolIndexBytes[data.symbolIndex] = data.indexBytes
      },
      "establish string symbol": async (data)=> {
        symbols[data.symbolIndex] = data.string
        symbolIndexBytes[data.symbolIndex] = data.indexBytes
      },
      "set tag list": async (data)=> {
        tags = data.symbols.map((symID)=> symbols[symID])
      },
      "define search result": async (data)=> {
        let hashables = [...tags.map(string => symbols.indexOf(string)), ...data.symbols].map(symID => symbolIndexBytes[symID])
        let terms = data.symbols.map(symID => symbols[symID])

        // calculate how similar the terms are to each other
        let vectorTerms = terms.filter(x => typeof(x) != 'string')
        let termDiversity = 0
        if (vectorTerms.length > 1) {
          // first average all the terms together
          let meanTerm = VU.mean(...vectorTerms)
          // calculate how far from the center point each term is
          let distances = vectorTerms.map(term => VU.distanceSquared(term, meanTerm))
          termDiversity = Math.max(...distances)
        }

        let concatenated = Uint8Array.from(Array.prototype.concat(...hashables.map(a => Array.from(a))));
        let hash = await this._hash(concatenated)
        for (let definitionIndex = 0; definitionIndex < data.definitions; definitionIndex++) {
          this.searchIndex.push(new SearchResultDefinition({ library: this, tags, terms, termDiversity, hash, definitionIndex }))
        }
      }
    }

    // run through the index file, using the packet handlers to update the interpreter state
    // and build the decoded data
    let cursor = 0
    let dataview = new DataView(indexData)
    while (cursor < indexData.byteLength) {
      let typeNum = dataview.getUint8(cursor)
      let decoder = PacketDecoder[typeNum]
      let decode = decoder(new DataView(indexData, cursor), this.settings)
      await packetHandlers[decode.type](decode.data)

      cursor += decode.length
    }

    this.isOpen = true
    return this
  }

  // returns an object containing all tags in this dataset, values are how many search results feature this tag
  getTags() {
    let tags = {}
    this.searchIndex.forEach(entry => {
      entry.tags.forEach(tag => tags[tag] = (tags[tag] || 0) + 1)
    })
    return tags
  }

  // lookup a word in the opened library
  // accepts an array of search terms, each term can be either a vector (Array of floats)
  // or a plaintext string for a fulltext match
  // Returns a promise, which resolves with an array of result objects like:
  // {
  //   id: unique ID for internal use or merging searches,
  //   entity: { terms: strings and vectors used for the match, tags: array of string tags },
  //   distance: a number, lower represents a better match, typically square distance (like pythagorus theorum)
  //   library: a reference to this library
  // }
  // To fetch the associated json metadata, you can call result.library.fetchDef(result)
  // To get a path to the first associated video you can call result.library.videoLink(result)
  // Options object:
  //   sort: (boolean) should returned array be sorted so the best matches appear first
  //   rankMode: (string || fn) one of [mixmean, mean, min, max, add], defines how the distances are calculated when search includes multiple queries
  //             when function, it's given an array of distance numbers, and should return a number
  async lookup(search, options = {}) {
    if (this.settings.version != 3) throw new Error("Unsupported version")
    if (typeof(options) == 'boolean') options = { sort: options }
    if (!this.isOpen) throw new Error("Search Library isn't open yet!")
    if (search && search.constructor != Array) search = [search]
    if (options.sort == undefined) options.sort = false
    if (options.rankMode == undefined) options.rankMode = 'mixmean'

    // special case for no search
    if (search == null || search.length == 0) {
      return this.searchIndex.map(result => Object.create(result, { distance: { value: 0 } }))
    }

    // select the rank function
    let rankFn
    if (typeof(options.rankMode) == 'function') {
      rankFn = options.rankMode
    } else {
      rankFn = {
        mixmean: (searchDistances)=> searchDistances.reduce((x,y) => x + y) * ((result.terms.length + searchDistances.length) / 2),
        mean: (searchDistances)=> searchDistances.reduce((x,y) => x + y) / result.terms.length,
        min: (searchDistances)=> Math.min(...searchDistances),
        max: (searchDistances)=> Math.max(...searchDistances),
        add: (searchDistances)=> searchDistances.reduce((x,y) => x + y),
      }[options.rankMode]
      if (typeof(rankFn) != 'function') throw new Error(`rankMode ${options.rankMode} is unknown`)
    }

    let results = this.searchIndex.map(result => {
      let ranked = Object.create(result)
      let searchDistances = search.map(searchTerm => {
        let distances = result.terms.map(resultTerm => {
          // if the result term is a string and the search term is a word vector or vice versa, return a made up large number - bad match!
          if (typeof(resultTerm) != typeof(searchTerm)) {
            return 10
          } else if (resultTerm.constructor == Array || resultTerm.constructor == Uint8Array) {
            return VU.distanceSquared(resultTerm, searchTerm)
          } else if (resultTerm.constructor == String) {
            if (resultTerm == searchTerm) { // perfect match! distance is zero!
              return 0
            } else if (resultTerm.toLowerCase() == searchTerm.toLowerCase()) { // case insensitive match. give it a little distance
              return 0.25
            }
          } else {
            throw new Error('entity term type unknown')
          }
        })

        // return the best match for each search term
        return Math.min(...distances)
      })

      // use the rank function to calculate a correct distance value
      ranked.distance = rankFn(searchDistances)
      ranked.parentSearchResult = result

      return ranked
    })

    // optionally sort the results
    if (options.sort) {
      return results.sort((a,b)=> a.distance - b.distance)
    } else {
      return results
    }
  }

  // gets the base path to metadata and media related to a specific result object returned by @lookup()
  getBasePath(result) {
    let prefix = result.id.substr(0, 2)
    let defPath = `${prefix}/${result.id}`
    if (this.settings.buildID !== undefined) defPath = `${this.settings.buildID}/${defPath}`
    return `${this.baseURL}/defs/${defPath}`
  }

  // internal method, called by SearchResultDefinition to fetch it's own search result data
  async _fetchDefinitionData(result) {
    let shardID = parseInt(Util.bytesToPrefixBits(result._hash, this.settings.shardBits), 2)
    let shardBlob = await this._fetch(`${this.baseURL}/defs/${this.settings.buildID}/${shardID}.json`)
    let shardData = JSON.parse(Util.decodeUTF8(shardBlob))
    let data = shardData[Util.bytesToBase16(result._hash)][result._definitionIndex]
    return data
  }

  // implements hashing of strings in to whichever hash algo is described in the header
  // resolves a promise with a Uint8Array
  _hashWeb(bytes) {
    const algos = {sha1: "SHA-1", sha256: "SHA-256", sha384: "SHA-384", sha512: "SHA-512"}
    return crypto.subtle.digest(algos[this.settings.hashFunction], bytes)
  }

  async _hashNodeJS(bytes) {
    let hash = require('crypto').createHash(this.settings.hashFunction)
    hash.write(bytes)
    return hash.digest().buffer
  }

  // exists as _fetchRegion (constructor patches the correct version in)
  // accepts a filename or url and a start and end range, and does a range request
  // to retrieve that part of the file from the server. On NodeJS this works via
  // normal filesystem operations instead. returns a promise
  async _fetchWeb(filename, checkCache = true) {
    let data = await fetch(encodeURI(filename), { mode: 'same-origin', credentials: 'omit', cache: checkCache ? 'no-cache' : 'default' })
    if (!data.ok) throw new Error(`Server responded with error code! "${data.status}" while loading "${filename}" Search Library`)
    let buffer = await data.arrayBuffer()
    return buffer
  }

  // first run will be a little slower than after that because of setup building the function
  async _fetchNodeJS(filename) {
    let fs = require('fs-extra')
    let buffer = (await fs.readFile(filename)).buffer
    return buffer
  }

  // test if two arrays or byte arrays are equal
  _bufferEqual(a,b) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.byteLength; i++) {
      if (a[i] != b[i]) return false
    }
    return true
  }

  _bufferToBase16(buffer) {
    return Array.from(new Uint8Array(buffer)).map((num)=> `0${num.toString('16')}`.substr(-2)).join('').toLowerCase()
  }
  
  toString() {
    return `<SearchLibraryReader ${this.name}>`
  }
}

if (typeof(module) == 'object')
  module.exports = SearchLibraryReader