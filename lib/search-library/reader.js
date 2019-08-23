// read in second generation "packet stream" style search library format, and provide access to all it's resources

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
    if (!window.symbols) window.symbols = []
    window.symbols.push(symbols)

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
        let hashables = data.symbols.map(symID => symbolIndexBytes[symID])
        let terms = data.symbols.map(symID => symbols[symID])

        let concatenated = Int8Array.from(Array.prototype.concat(...hashables.map(a => Array.from(a))));
        let hash = await this._hash(concatenated)
        let index = this._bufferToBase16(hash)
        for (let recordId = 0; recordId < data.definitions; recordId++) {
          this.searchIndex.push({
            url: `${index}/definition-${recordId}`,
            tags: tags,
            terms: terms
          })
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

  // lookup a word in the opened library
  // accepts either a vector (array of floats), or a string (word to do a hash search on)
  async lookup(search, sort = false) {
    if (!this.isOpen) throw new Error("Search Library isn't open yet!")
    if (search.constructor != Array) search = [search]

    // special case for no search
    if (search == null || search.length == 0) {
      return this.searchIndex.map(entity => ({ id: entity.url, entity, distance: 1, library: this }))
    }

    // if we have a search, calculate distances or aproximate with plaintext searches
    let results = {}
    for (let entity of this.searchIndex) {
      let result = results[entity.url] = { id: entity.url, entity, distance: Infinity, library: this }
      let searchDistances = search.map(searchTerm => {
        return Math.min(...entity.terms.map(entityTerm => {
          if (typeof(entityTerm) != typeof(searchTerm)) return 10
          if (entityTerm.constructor == Array || entityTerm.constructor == Uint8Array) {
            return this._distSquared(entityTerm, searchTerm)
          } else if (entityTerm.constructor == String) {
            if (searchTerm == entityTerm) return 0
            else if (searchTerm.toLowerCase() == entityTerm.toLowerCase()) return 0.25
          } else {
            throw new Error('entity term type unknown')
          }
        }))
      })
      result.distance = searchDistances.reduce((x,y) => x + y) * ((entity.terms.length + searchDistances.length) / 2)
    }

    // optionally sort the results
    if (sort) {
      return Object.values(results).sort((a,b)=> a.distance - b.distance)
    } else {
      return Object.values(results)
    }
  }

  // get the definition object from this dataset
  // TODO: adjust front end to take in to account we use the whole result object here instead of the defIdx
  async fetchDef(result) {
    let prefix = result.id.substr(0, 2)
    let data = await this._fetch(`${this.baseURL}/defs/${prefix}/${result.id}.json`)
    let text = (new TextDecoder()).decode(data)
    let json = JSON.parse(text)
    if (!json.data) json = {outOfDate: false, variations: json.variations, data: json}
    if (json.buildTimestamp) json.outOfDate = json.buildTimestamp != this.settings.buildTimestamp
    return json
  }

  // get a video link for a definition & varient from this dataset
  videoLink(result, variant = 0, extension = ".mp4") {
    let prefix = result.id.substr(0, 2)
    return `${this.baseURL}/defs/${prefix}/${result.id}-video-${variant}${extension}`
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
  async _fetchWeb(filename) {
    let data = await fetch(filename, {redirect: 'follow', mode: 'same-origin', credentials: 'omit', referrer: 'omit', cache: 'default'})
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

  // calculate squared Euclidean distance between two vectors, adapted from how tensorflow does it
  _distSquared(a, b) {
    let result = 0
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i]
      result += diff * diff
    }
    return result
  }

  _bufferToBase16(buffer) {
    return Array.from(new Uint8Array(buffer)).map((num)=> `0${num.toString('16')}`.substr(-2)).join('')
  }
  
  toString() {
    return `<SearchLibraryReader ${this.name}>`
  }
}

if (typeof(module) == 'object')
  module.exports = SearchLibraryReader