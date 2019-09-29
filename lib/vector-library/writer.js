// Vector Library Writer v2
// This writes out a "vector library database" (something I made up)
// basically a vector library is a config.json file which specifies the format, and a sharded folder structure
// containing 2 to the power of settings.shardBits files named like "f323.bin"
// the bin files contain a sequence of TLV packets [uint8, uint16, ...data]
// with 2 types:
// type 0: string
// type 1: vector
// string is just a utf8 encoded string labeling the next vector
// vector contains two parts:
// 1: an uint8 which is the scaling value, scale of 1 means -0.25 to +0.25, scale of 4 means -1 to +1, scale of 8 means -2 to +2
// 2: a series of numbers, encoded in `format` representing the vector data

const fs = require('fs-extra')
const util = require('util')
const zlib = require('zlib')
const crypto = require('crypto')

class VectorLibraryWriter {
  // accepts a path, e.g. datasets/Word-Vector-Library
  // settings can be:
  // {
  //   hashFunction: 'sha256', (control which hash function is used to determine which shard and prefix folder to use)
  //   vectorSize: 300, (maybe useful for different vector databases in future?)
  //   vectorBits: 8, (how many bits to use to store each number in a vector? 8 gives 256 possible values)
  //   prefixBits: 8, (how many bytes to use for folder prefixing)
  //   shardBits: 16, (how many bits to index by, more means a bigger more precise index)
  //   gzip: true || false (should the writer statically gzip every file in the finish stage)
  // }
  constructor(path, settings = {}) {
    this.basePath = path
    this.settings = {
      hashFunction: settings.hashFunction || 'sha256',
      vectorSize: settings.vectorSize || 300,
      vectorBits: settings.vectorBits || 8,
      prefixBits: settings.prefixBits || 8,
      shardBits: settings.shardBits || 16,
      caseInsensitive: settings.caseInsensitive || true,
      gzip: settings.gzip || false
    }

    this.paths = {
      config: `${this.basePath}/config.json`,
      data: `${this.basePath}/data`
    }
    this.opened = false
  }


  // erase and initialise the word vector library generation
  async open() {
    await fs.remove(this.basePath)
    await fs.ensureDir(this.paths.data)
    await fs.writeJSON(this.paths.config, this.settings)
    this.opened = true
    this.vectorsWritten = 0
    this.filesAccessed = new Set()
    this.filesAccessed.add(this.paths.config)
    return this
  }


  // internal: hash a string using the specified `hashFunction`
  hash(wordString) {
    let hash = crypto.createHash(this.settings.hashFunction)
    hash.write(wordString)
    return hash.digest()
  }

  // internal: encode a number as a signed int of arbitrary bit precision
  // returns a binary string of 0 and 1 characters
  encodeNumber(floatNum) {
    let intMax = ((2 ** (this.settings.vectorBits - 1)) - 1)
    let intNum = Math.round(floatNum * intMax)
    let numBinary = ('0'.repeat(this.settings.vectorBits) + Math.abs(intNum).toString(2)).slice(-(this.settings.vectorBits - 1))
    let negativePrefix = (intNum < 0) ? '1' : '0'
    return `${negativePrefix}${numBinary}`
  }

  // internal: encode a vector in to the compressed format
  encodeVector(vector) {
    if (!vector || vector.length != this.settings.vectorSize) throw new Error("vector must be array of correct size, received " + vector.length)
    
    // built scaling info
    let scaling = Math.max(...vector.map(n => Math.ceil(Math.abs(n * 4))))
    let actualScaling = scaling / 4
    let scalingBuffer = Buffer.alloc(1)
    scalingBuffer.writeUInt8(scaling, 0)

    // build buffer of numbers of arbitrary bit precision
    let numberBuffer = Buffer.alloc(Math.ceil(vector.length * this.settings.vectorBits / 8))
    let numberBinaryData = vector.map(num => this.encodeNumber(num / actualScaling)).join('') + '0'.repeat(8)
    for (let byteIdx = 0; byteIdx < numberBuffer.byteLength; byteIdx++) {
      numberBuffer.writeUInt8(parseInt(numberBinaryData.slice(byteIdx * 8, (byteIdx + 1) * 8), 2), byteIdx)
    }
    
    return Buffer.concat([scalingBuffer, numberBuffer])
  }

  // internal: encode a TLV packet
  encodeTLV(type, valueBuffer) {
    let header = Buffer.alloc(3)
    header.writeUInt8(type, 0)
    header.writeUInt16BE(valueBuffer.byteLength, 1)
    return Buffer.concat([header, valueBuffer])
  }

  // internal, takes a hash buffer, and returns a string encoding the first bits-many bits of it for filenames
  bitsString(hashData, bits) {
    let prefixBytes = Array.from(Buffer.from(hashData.slice(0, Math.ceil(bits / 8))))
    let bitmapString = prefixBytes.map(n => ("00000000" + n.toString(2)).slice(-8)).join('').slice(0, bits)
    let num = parseInt(bitmapString, 2)
    return num
  }


  // add a word and vector pair to the database
  // accepts a word string, and a vector as an array of floats
  // returns a promise which resolves when updates are written to temp stores
  async append(word, vector) {
    if (!this.opened) throw new Error("vector library not yet opened")
    if (this.settings.shardBits <= this.settings.prefixBits) throw new Error("shard bits should be larger than prefix bits")
    
    // generate word hash
    let hash = this.hash(this.settings.caseInsensitive ? word.toLowerCase() : word)

    let path = `${this.paths.data}/${this.bitsString(hash, this.settings.prefixBits)}`
    let shardFn = `${path}/${this.bitsString(hash, this.settings.shardBits)}.bin`

    let vectorData = this.encodeVector(vector)

    let stringPacket = this.encodeTLV(0, Buffer.from(word))
    let vectorPacket = this.encodeTLV(1, vectorData)
    let appendData = Buffer.concat([stringPacket, vectorPacket])
    await fs.ensureDir(path)
    await fs.appendFile(shardFn, appendData)
    this.filesAccessed.add(shardFn)
    this.vectorsWritten += 1
  }


  // Do any final compression tasks (like gzipping? closing files?) and return how many vectors were stored to the database
  async finish() {
    if (this.settings.gzip) {
      for (let filename of this.filesAccessed) {
        await fs.writeFile(`${filename}.gz`, await util.promisify(zlib.gzip)(await fs.readFile(filename), { level: 9 }))
      }
    }

    return this.vectorsWritten
  }
}

module.exports = VectorLibraryWriter