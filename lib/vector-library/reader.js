// Vector Library Reader v2
// This library decodes the vector database sharded file format, which compresses the 4gb fasttext
// word embedding dataset of 2 million words down to about 100mb, split across files that are about
// 7kb big each, trying to skirt just under the 8kb block size of most filesystems for efficient storage
// and to keep load size reasonable.

// Improvements over the v1 format:
//  - Most browsers don't use gzip compression on range requests, sharding the files allows gzip delivery over http
//  - Firefox allows gzip on range requests, but either it or nginx's implementation is broken, and corrupted the files
//  - Compression of vectors is a lot betterso data loaded should be much smaller
//  - Use of sharded files should make it easier for downstream http caches to efficiently cache
//  - Use of sharded files should make it easier to publish to P2P backends like IPFS

// IMPORTANT! This implementation of VectorLibraryReader is not back compatible to the original flat file format
// so be careful!

class VectorLibraryReader {
  // create a new Vector Library Reader
  constructor() {
    this.settings = {}
    this.opened = false

    this.binaryByteLookup = new Array(256)
    for (let i = 0; i < 256; i++) {
      this.binaryByteLookup[i] = ("0".repeat(8) + i.toString(2)).slice(-8)
    }

    // detect if we're running on node-js or browser stack
    this.fetch = this._fetchWeb
    this.hash = this._hashWeb
    if (typeof process === 'object') {
      if (typeof process.versions === 'object') {
        if (typeof process.versions.node !== 'undefined') {
          this.fetch = this._fetchNodeJS
          this.hash = this._hashNodeJS
        }
      }
    }
  }

  // open a Vector Library at a certain url
  async open(url) {
    this.name = url.split('/').slice(-1)[0]
    this.baseURL = url
    this.paths = {
      config: `${this.baseURL}/config.json`,
      data: `${this.baseURL}/data`
    }
    
    // fetch settings and decode that stuff
    let settingsData = await this.fetch(this.paths.config)
    let utf8Decoder = new TextDecoder()
    this.settings = JSON.parse(utf8Decoder.decode(settingsData))
    
    // we are now open!
    this.opened = true
    return this
  }

  // decode a Type, Length, Value packet
  decodeTLV(buffer) {
    let headerDataView = new DataView(buffer, 0, 3)
    let typeNum = headerDataView.getInt8(0)
    let length = headerDataView.getUint16(1, false)
    let data = buffer.slice(3, 3 + length)
    let tail = buffer.slice(3 + length)
    return {typeNum, data, tail}
  }

  // internal: encode a number to the specified `format`
  decodeNumbers(buffer) {
    let intMax = ((2 ** (this.settings.vectorBits - 1)) - 1)
    let bytes = [...(new Uint8Array(buffer))]
    let binaryString = bytes.map(b => this.binaryByteLookup[b]).join('')
    
    let numbers = new Array(this.settings.vectorSize)
    for (let numIdx = 0; numIdx < this.settings.vectorSize; numIdx++) {
      let numberString = binaryString.slice(numIdx * this.settings.vectorBits, (numIdx + 1) * this.settings.vectorBits)
      let negative = numberString.slice(0, 1) == '1'
      let absoluteValue = parseInt(numberString.slice(1), 2) / intMax
      numbers[numIdx] = negative ? -absoluteValue : +absoluteValue
    }
    return numbers
  }

  // internal: encode a vector in to the compressed format
  decodeVector(data) {
    let view = new DataView(data)
    
    // build base zeroed vector
    let vector = new Array(this.settings.vectorSize)
    vector.fill(0)

    // get scaling factor
    let scaling = view.getUint8(0) / 4

    // decode the vector pieces
    let unscaledVector = this.decodeNumbers(data.slice(1, 1 + Math.ceil(this.settings.vectorSize * this.settings.vectorBits / 8)))

    return unscaledVector.map(n => n * scaling)
  }

  // internal, takes a hash buffer, and returns a number representing the first `bits` many bits of the buffer data
  // used for generating prefix and shard filenames with an arbitrary level of grouping
  bitsString(hashData, bits) {
    let bytes = Math.ceil(bits / 8)
    let binaryString = [...new Uint8Array(hashData.slice(0, bytes))].map(byte => this.binaryByteLookup[byte]).join('').slice(0, bits)
    let num = parseInt(binaryString, 2)
    return num
  }

  // lookup a word in the opened library
  async lookup(search) {
    if (!this.opened) throw new Error("Vector Library Reader hasn't been opened yet, cannot lookup without configuration data")
    let utf8Decoder = new TextDecoder()
    let hash = await this.hash(this.settings.caseInsensitive ? search.toLowerCase() : search)
    let path = `${this.paths.data}/${this.bitsString(hash, this.settings.prefixBits)}`
    let shardFn = `${path}/${this.bitsString(hash, this.settings.shardBits)}.bin`
    
    let shardData = await this.fetch(shardFn)

    // hash table to store embeddings in this shard
    let embeddings = {}

    // read the shard data
    let buffer = shardData
    let word = null
    while (buffer.byteLength > 0) {
      let {typeNum, data, tail} = this.decodeTLV(buffer)
      if (typeNum == 0) {
        word = utf8Decoder.decode(data)
      } else if (typeNum == 1) {
        embeddings[word] = data
      } else {
        console.info(`Vector library received unknown packet type ${typeNum}`)
      }
      buffer = tail
    }

    if (embeddings[search]) {
      return this.decodeVector(embeddings[search])
    }

    return null // failed to find vector?
  }

  // implements hashing of strings in to whichever hash algo is described in the header
  // resolves a promise with a Uint8Array
  _hashWeb(word) {
    const algos = {sha1: "SHA-1", sha256: "SHA-256", sha384: "SHA-384", sha512: "SHA-512"}
    let buffer = (new TextEncoder()).encode(word)
    return crypto.subtle.digest(algos[this.settings.hashFunction], buffer)
  }

  async _hashNodeJS(word) {
    let hash = require('crypto').createHash(this.settings.hashFunction)
    hash.write(word)
    return hash.digest().buffer
  }

  // read the contents of a file in to an ArrayBuffer, for web clients
  async _fetchWeb(filename) {
    let data = await fetch(filename, {redirect: 'follow', mode: 'same-origin', credentials: 'omit', referrer: 'omit', cache: 'default'})
    if (!data.ok) throw new Error(`Server responded with error code! "${data.status}" while loading "${filename}" Search Library`)
    return await data.arrayBuffer()
  }

  // first run will be a little slower than after that because of setup building the function
  async _fetchNodeJS(filename) {
    let fs = require('fs-extra')
    return (await fs.readFile(filename)).buffer
  }
}

if (typeof(module) == 'object')
  module.exports = VectorLibraryReader