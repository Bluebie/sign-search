// Vector Library version 3
// this version works effectively the same way as version 2, but stores shards as cbor streams
// and unifies building and reading in to one class, and add's automatic vector scaling

// config is stored as regular json for human readability, and contains the settings object

// shard files contain a stream of cbor entries, each group of four entries representing a pair
// the order of these components are:
//   1: <string> text word
//   2: <float> scaling value
//   3: <Uint8Array> vectorData

const fsutil = require('../sign-search-utils')
const cbor = require('borc')
const assert = require('assert')

class VectorLibrary {
  // Initialise a Vector Library reader/writer
  // Required for read only use:
  //   fs: { readFile(path) } // readFile must return a promise which resolves with a Uint8Array
  //   digest(algo, buffer) // accepts an algorithm like sha256, and a Uint8Array of data to digest, returns a promise resolving with a Uint8Array hash
  //   path: <string> // a string path to the vector library on the filesystem
  // Required for writing:
  //   fs: reference to require('fs-extra') or a similar promisified fs implementation
  // Optional:
  //   textFilter: a function which transforms word strings to a consistent format (i.e. lowercase)
  constructor(config = {}) {
    this.config = config
    assert(this.config.fs, `"fs" is a required configurable option`)
    assert(this.config.path, `"path" is a required configurable option`)
    assert(this.config.digest, `"digest" is a required configurable option`)
    this.settings = {
      hashFunction: this.config.hashFunction || 'sha256',
      vectorSize: this.config.vectorSize || 300,
      vectorBits: this.config.vectorBits || 8,
      buildTimestamp: this.config.buildTimestamp || Date.now(),
      prefixBits: this.config.prefixBits || 7,
      shardBits: this.config.shardBits || 13,
    }
  }

  // load the settings from an existing build
  async open() {
    this.settings = JSON.parse(await this.config.fs.readFile(`${this.config.path}/settings.json`))
    return this
  }

  // takes a word string as input, and calculates which shard it should go in
  // in reading mode, make sure to open() the library first - settings.json data is important!
  async getWordInfo(stringWord) {
    if (this.config.textFilter) stringWord = this.config.textFilter(stringWord)
    let wordHash = await this.config.digest(this.settings.hashFunction, fsutil.encodeUTF8(stringWord))
    let prefixID = parseInt(fsutil.bytesToPrefixBits(wordHash, this.settings.prefixBits), 2)
    let shardID  = parseInt(fsutil.bytesToPrefixBits(wordHash, this.settings.shardBits), 2)
    return { filtered: stringWord, prefixID, shardID, path: `${this.config.path}/shards/${prefixID}/${shardID}.cbor` }
  }

  // add a definition to the Vector Library
  async addDefinition(stringWord, vectorArray) {
    // grab info about this word and which shard it should live in
    let { path: shardPath, filtered } = await this.getWordInfo(stringWord)
    
    // figure out what the largest number in the vector is to use as a scaling value
    let vectorScale = Math.max(...vectorArray.map(Math.abs))
    // scale the digits accordingly
    let scaledVector = vectorArray.map(x => x / vectorScale)
    // pack the numbers in to a buffer of integers
    let packedVector = fsutil.packFloats(scaledVector, this.settings.vectorBits)
    // cbor encode each piece and append them
    let appendData = Buffer.concat([filtered, vectorScale, packedVector].map(x => cbor.encode(x)))
    // write out the new definition data to the correct shard
    await this.config.fs.ensureFile(shardPath)
    await this.config.fs.appendFile(shardPath, appendData)
  }

  // lookup a word in the vector library
  async lookup(stringWord) {
    // grab info about this word
    let { path: shardPath, filtered } = await this.getWordInfo(stringWord)
    // load shard data
    let shardData = cbor.decodeAll(await this.config.fs.readFile(shardPath))
    // iterate through entries in this shard until we find a match
    for (let [chunkWord, vectorScale, packedVector] of fsutil.chunkIterable(shardData, 3)) {
      if (filtered == chunkWord) {
        let scaledVector = fsutil.unpackFloats(packedVector, this.settings.vectorBits, this.settings.vectorSize)
        return scaledVector.map(x => x * vectorScale)
      }
    }
  }

  // finish writing to a vector library
  async save() {
    await this.config.fs.writeFile(`${this.config.path}/settings.json`, fsutil.encodeUTF8(JSON.stringify(this.settings, null, 2)))
  }
}

module.exports = VectorLibrary