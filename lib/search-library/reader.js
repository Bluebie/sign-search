// read in second generation "packet stream" style search library format, and provide access to all it's resources

let PacketDecoder = [
  null, // type 0 isn't used

  // type 1: settings block
  (dataview, settings)=> ({
    type: 'settings',
    length: 3 + dataview.getUint16(1),
    data: JSON.parse(
      (new TextDecoder()).decode(dataview.buffer.slice(3, 3 + dataview.getUint16(1)))
    )
  }),

  // type 2: clear tags block
  (dataview, settings)=> ({
    type: 'clear tags',
    length: 1,
    data: {}
  }),
  
  // type 3: add tag block
  (dataview, settings)=> ({
    type: 'add tag',
    length: 2 + dataview.getUint8(1),
    data: {
      tag: (new TextDecoder()).decode(dataview.buffer.slice(dataview.byteOffset + 2, dataview.byteOffset + 2 + dataview.getUint8(1)))
    }
  }),

  // type 4: set unknown words block
  (dataview, settings)=> ({
    type: 'set unknown words',
    length: 3 + dataview.getUint16(1),
    data: {
      unknownWords: (new TextDecoder()).decode(dataview.buffer.slice(dataview.byteOffset + 3, dataview.byteOffset + 3 + dataview.getUint16(1))).split("\0"),
      indexBytes: new Uint8Array(dataview.buffer, dataview.byteOffset + 3, dataview.getUint16(1))
    }
  }),

  // type 5: define vector block
  (dataview, settings)=> {
    let vectorNumSize = ({sint8: 1, sint16: 2, float32: 4}[settings.format])
    let vectorByteSize = settings.vectorSize * vectorNumSize
    let definitions = dataview.getUint16(1)

    // decompress vector
    let getter = ({sint8: 'getInt8', sint16: 'getInt16', float32: 'getFloat32'})[settings.format]
    let maxVal = ({sint8: 127, sint16: 32767, float32: 1.0})[settings.format]
    let vector = []
    for (let i = 0; i < settings.vectorSize; i++) {
      vector[i] = dataview[getter].call(dataview, 3 + (i * vectorNumSize)) / maxVal * settings.scaling
    }
    
    return {
      type: 'define vector',
      length: 3 + vectorByteSize,
      data: {
        vector,
        definitions,
        indexBytes: new Uint8Array(dataview.buffer, dataview.byteOffset + 3, vectorByteSize)
      }
    }
  },

  // type 6: null vector block
  (dataview, settings)=> ({
    type: 'null vector',
    length: 3,
    data: {
      definitions: dataview.getUint16(1),
    }
  })
]



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

    // decoding state values
    let tags = []
    let unknownWords = []
    let nullVectorIndexBytes = null

    // code paths to handle each decoded packet type and update the state machine
    let packetHandlers = {
      "settings": async (data)=> this.settings = data,
      "clear tags": async ()=> tags = [],
      "add tag": async (data)=> tags = tags.concat([data.tag]),
      "set unknown words": async (data)=> {
        unknownWords = data.unknownWords
        nullVectorIndexBytes = data.indexBytes
      },
      "define vector": async (data)=> {
        let hash = await this._hash(data.indexBytes)
        let index = this._bufferToBase16(hash)
        for (let recordId = 0; recordId < data.definitions; recordId++) {
          this.searchIndex.push({
            url: `${index}/definition-${recordId}`,
            tags: tags,
            unknownWords: unknownWords,
            vector: data.vector
          })
        }
        unknownWords = []
        nullVectorIndexBytes = null
      },
      "null vector": async (data)=> {
        let hash = await this._hash(nullVectorIndexBytes)
        let index = this._bufferToBase16(hash)
        for (let recordId = 0; recordId < data.definitions; recordId++) {
          this.searchIndex.push({
            url: `${index}/definition-${recordId}`,
            tags: tags,
            unknownWords: unknownWords,
            vector: null
          })
        }
        unknownWords = []
        nullVectorIndexBytes = null
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

    let results = []
    if (typeof(search) == 'string') { // text search
      for (let entity of this.searchIndex) {
        let match = entity.unknownWords.filter((word)=> word.toLowerCase() == search.toLowerCase()).length > 0
        if (match) {
          results.push({ id: entity.url, entity, distance: 0, library: this })
        }
      }
    } else { // vector search
      for (let entity of this.searchIndex) {
        if (entity.vector == null) continue
        let score = this._distSquared(entity.vector, search)
        results.push({ id: entity.url, entity, distance: score, library: this })
      }
    }

    if (sort) {
      return results.sort((a,b)=> a.distance - b.distance)
    } else {
      return results
    }
  }

  // get the definition object from this dataset
  // TODO: adjust front end to take in to account we use the whole result object here instead of the defIdx
  async fetchDef(result) {
    let prefix = result.id.substr(0, 2)
    let data = await this._fetch(`${this.baseURL}/defs/${prefix}/${result.id}.json`)
    let text = (new TextDecoder()).decode(data)
    let json = JSON.parse(text)
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
  _fetchWeb(filename) {
    return fetch(filename).then((data)=> data.arrayBuffer())
  }

  // first run will be a little slower than after that because of setup building the function
  async _fetchNodeJS(filename) {
    let readFile = require('util').promisify(require('fs').readFile)
    return (await readFile(filename)).buffer
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