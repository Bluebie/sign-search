// Vector Library Reader is a tool which should work both under NodeJS and in modern 
// web environments to lookup a Vector Library generated with vector-library-writer.js
// and find a vector for a known word
// On both web and on NodeJS, this reader can deal with very large databases because it
// uses partial reads to decompress only the parts of the file it needs, either over http
// range requests or direct filesystem reads. HTTP server MUST support Range requests
// This likely means you cannot gzip your vector libraries, but don't worry, they're already
// quite compressed and optimised. With a two million vector library initial open only requires
// 66kb of index data, and a typical query only requires loading a similar amount again.

class VectorLibraryReader {
  // create a new Vector Library Reader
  constructor() {
    this.header = {}
    this.ranges = {}

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
    this.entries = {}

    // fetch the db index in to memory
    let indexData = await this._fetch(`${this.baseURL}/db-index.bin`)

    // decode header data
    let hData = new DataView(indexData, 0, 9)
    this.header = {
      hashType: [null, 'sha1', 'sha256', 'sha384', 'sha512'][hData.getUint8(0)],
      hashByteSize: hData.getUint16(1),
      vectorSize: hData.getUint16(3),
      format: ['sint8', 'sint16', 'float32'][hData.getUint8(5)],
      prefixBytes: hData.getUint8(6),
      lengthByteSize: hData.getUint8(7), // how many bytes of number are in each length entry below header?
      scaling: hData.getUint8(8) // multiply all vector numbers by this to get correct scale back
    }
    this.header.vectorByteSize = this.header.vectorSize
      * ({sint8: 1, sint16: 2, float32: 4}[this.header.format])

    // parse the actual bulk data - decoding the compressed integer lengths
    let eData = new DataView(indexData, 9)
    let highestEntry = parseInt('FFFFFFFF'.substr(-this.header.prefixBytes * 2), 16)
    let entries = []
    if (this.header.lengthByteSize == 1)
      for (let i = 0; i <= highestEntry; i++) entries.push(eData.getUint8(i))
    else if (this.header.lengthByteSize == 2)
      for (let i = 0; i <= highestEntry; i++) entries.push(eData.getUint16(i * 2))
    else if (this.header.lengthByteSize == 3)
      for (let i = 0; i <= highestEntry; i++)
        entries.push((eData.getUint8(i * 3) << 16) | eData.getUint16((i * 3) + 1))
    else if (this.header.lengthByteSize == 4)
      for (let i = 0; i <= highestEntry; i++) entries.push(eData.getUint32(i * 4))
    else
      throw new Error("VectorLibraryReader does not currently support lengthByteSize > 4")
    
    // now we should know how many entries are in each bucket, so we can compute the start and end addresses
    let addrBuffer = new DataView(new ArrayBuffer(4))
    let cursor = 0
    entries.forEach((length, index)=> {
      addrBuffer.setUint32(0, index)
      let hexPrefix = this._bufferToHex(addrBuffer.buffer).substr(-this.header.prefixBytes * 2)
      this.entries[hexPrefix] = [cursor, cursor + length]
      cursor += length
    })

    this.open = true
    return this
  }

  // lookup a word in the opened library
  async lookup(word) {
    let hash = await this._hash(word)
    let hashString = this._bufferToHex(hash)
    let hexPrefix = hashString.substr(0, this.header.prefixBytes * 2)
    let [regionStart, regionEnd] = this.entries[hexPrefix]

    let [stringsRaw, vectorsRaw] = await Promise.all([
      this._fetch(`${this.baseURL}/db-strings.bin`, regionStart * this.header.hashByteSize  , regionEnd * this.header.hashByteSize),
      this._fetch(`${this.baseURL}/db-vectors.bin`, regionStart * this.header.vectorByteSize, regionEnd * this.header.vectorByteSize)
    ])

    let count = stringsRaw.byteLength / this.header.hashByteSize
    let hashSize = this.header.hashByteSize
    for (let i = 0; i < count; i++) {
      let indexStringHash = this._bufferToHex(stringsRaw.slice(hashSize * i, hashSize * (i+1)))
      // if we found our string, decode vector and return it!
      if (indexStringHash == hashString) {
        let vectorDataView = new DataView(vectorsRaw, this.header.vectorByteSize * i, this.header.vectorByteSize)
        let vector = []
        if (this.header.format == 'sint8')
          for (let vIdx = 0; vIdx < this.header.vectorSize; vIdx++) vector.push(vectorDataView.getInt8(vIdx) / 127)
        else if (this.header.format == 'sint16')
          for (let vIdx = 0; vIdx < this.header.vectorSize; vIdx++) vector.push(vectorDataView.getInt16(vIdx * 2) / 32767)
        else if (this.header.format == 'float32')
          for (let vIdx = 0; vIdx < this.header.vectorSize; vIdx++) vector.push(vectorDataView.getFloat32(vIdx * 4))
        else
          throw new Error(`Unsupported format: "${this.header.format}", cannot decode vector`)
        
        // add scaling multiplication if needed
        if (this.header.scaling != 1) vector = vector.map((n)=> n * this.header.scaling)
        return vector // finished! victory!
      }
    }

    return null // failed to find vector?
  }

  // implements hashing of strings in to whichever hash algo is described in the header
  // resolves a promise with a Uint8Array
  _hashWeb(word) {
    const algos = {sha1: "SHA-1", sha256: "SHA-256", sha384: "SHA-384", sha512: "SHA-512"}
    let buffer = (new TextEncoder()).encode(word)
    return crypto.subtle.digest(algos[this.header.hashType], buffer)
  }

  async _hashNodeJS(word) {
    let hash = require('crypto').createHash(this.header.hashType)
    hash.write(word)
    return hash.digest().buffer
  }

  // exists as _fetchRegion (constructor patches the correct version in)
  // accepts a filename or url and a start and end range, and does a range request
  // to retrieve that part of the file from the server. On NodeJS this works via
  // normal filesystem operations instead. returns a promise
  async _fetchWeb(filename, start = null, end = null) {
    var reqHeaders = new Headers()
    if (start !== null || end !== null) reqHeaders.append('Range', `bytes=${start}-${end}`)
    let data = await fetch(filename, {headers: reqHeaders, redirect: 'follow', mode: 'same-origin', credentials: 'omit', referrer: 'omit', cache: 'default'})
    if (!data.ok) throw new Error(`Server responded with error code! "${data.status}" while loading "${filename}" Vector Library`)
    return await data.arrayBuffer()
  }

  // first run will be a little slower than after that because of setup building the function
  _fetchNodeJS(filename, start = null, end = null) {
    let util = require('util')
    let fs = require('fs')
    let [readFile, open, read, close] = ['readFile', 'open', 'read', 'close'].map((x)=> util.promisify(fs[x]))
    // build a nice fast fetch function and overwrite this function with it, with all the dependancies
    // closured in
    this._fetch = async function(filename, start = null, end = null) {
      // if not a range request, load the whole file
      if (start === null || end === null) return (await readFile(filename)).buffer
      // if it's a range request, we need to do something a bit more elaborate
      let fd = await open(filename, 'r')
      let data = new Uint8Array(end - start)
      await read(fd, data, 0, data.byteLength, start)
      await close(fd)
      return data.buffer
    }
    // run this initial request
    return this._fetch(filename, start, end)
  }

  // convert an ArrayBuffer in to hex string - from https://stackoverflow.com/a/50767210
  _bufferToHex(buffer) {
    return Array
        .from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart (2, "0"))
        .join("")
  }
}

if (typeof(module) == 'object')
  module.exports = VectorLibraryReader