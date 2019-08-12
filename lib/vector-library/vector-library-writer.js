// Vector Library Writer
// This writes out a "vector library database" (something i made up) which is basically a table containing
// hash indexed pairings of words to word embedding vectors, optimised for use on the web. Words are
// hashed, the first two bytes (by default) of the hash are used to create ~65,000 buckets, which have their
// offsets indexed in to a db-index file. the db-strings file contains hashes of words, and the db-vectors
// file contains word embedding vectors, either as float32 bytes, or compressed as signed integers with
// either 8 or 16 bits resolution. Depending on your application and need for precision, you might be able
// to get away with sint8 formatting, which will make your vector file 4x smaller than float32!


const fs = require('fs')
const path = require('path')
const util = require('util')
const os = require('os')
const crypto = require('crypto')
const promisify = util.promisify

class VectorLibraryWriter {
  // accepts a path, e.g. datasets/Word-Vector-Library
  // settings can be:
  // {
  //   hashType: 'sha1', (which hash function to use)
  //   vectorSize: 300, (maybe useful for different vector databases in future?)
  //   format: 'sint8', 'sint16' or 'float32',
  //   prefixBytes: 2, (how many bytes to index by, more means a bigger more precise index)
  //   scaling: 1, divides the vector's range to get it in to the -1 to +1 range compatible with the int formats
  // }
  constructor(path, settings = {}) {
    this.basePath = path
    this.settings = {
      hashType: settings.hashType || 'sha1',
      vectorSize: settings.vectorSize || 300,
      format: settings.format || 'sint16',
      prefixBytes: settings.prefixBytes || 2,
      scaling: settings.scaling || 1,
    }
    this.paths = {
      index: `${this.basePath}/db-index.bin`,
      strings: `${this.basePath}/db-strings.bin`,
      vectors: `${this.basePath}/db-vectors.bin`
    }
  }


  // erase and initialise the word vector library generation
  async open() {
    let writeFile = util.promisify(fs.writeFile)
    let mkdtemp = util.promisify(fs.mkdtemp)

    await Promise.all([
      writeFile(this.paths.index, ''),
      writeFile(this.paths.strings, ''),
      writeFile(this.paths.vectors, '')
    ])

    this.paths.temp = await mkdtemp(path.join(os.tmpdir(), 'vector-library-writer-'))
    this.recordedPrefixes = {} // empty the index of which hash prefixes are in use
    this.maxPerBlock = 0

    return this
  }


  // hash function, used internally
  hash(wordString) {
    let hash = crypto.createHash(this.settings.hashType)
    hash.write(wordString)
    return hash.digest()
  }


  // add a word and vector pair to the database
  // accepts a word string, and a vector as an array of floats
  // returns a promise which resolves when updates are written to temp stores
  append(word, vector) {
    if (!this.paths.temp) throw new Error("vector database must be opened first")
    if (!vector || vector.length != this.settings.vectorSize) throw new Error("vector must be array of correct size")
    let appendFile = promisify(fs.appendFile)

    // generate word hash
    let hashBuffer = this.hash(word)

    // generate compressed vector
    let numberSize = {sint8: 1, sint16: 2, float32: 4}[this.settings.format]
    let vectorByteSize = this.settings.vectorSize * numberSize
    let vectorBuffer = Buffer.alloc(vectorByteSize)
    if (this.settings.format == 'sint8') {
      vector.forEach((number, nIndex)=> vectorBuffer.writeInt8(Math.round(number * 127 / this.settings.scaling), nIndex))
    } else if (this.settings.format == 'sint16') {
      vector.forEach((number, nIndex)=> vectorBuffer.writeInt16BE(Math.round(number * 32767 / this.settings.scaling), nIndex * 2))
    } else if (this.settings.format == 'float32') {
      vector.forEach((number, nIndex)=> vectorBuffer.writeFloatBE(number / this.settings.scaling, nIndex * 4))
    } else {
      throw new Error('Unknown Format specified in index writer settings')
    }

    // generate index entry
    let prefix = hashBuffer.toString('hex').substr(0, this.settings.prefixBytes * 2)
    if (this.recordedPrefixes[prefix] === undefined) this.recordedPrefixes[prefix] = 0
    this.recordedPrefixes[prefix] += 1

    // write our vector and hash in to the temp buckets
    return Promise.all([
      appendFile(path.join(this.paths.temp, `${prefix}-vectors.bin`), vectorBuffer),
      appendFile(path.join(this.paths.temp, `${prefix}-strings.bin`), hashBuffer)
    ])
  }


  // compress the resulting database in to just a few files, and clear out all the temp files
  // this process will probably take a while
  async finish() {
    let readdir = util.promisify(fs.readdir)
    let unlink = util.promisify(fs.unlink)
    let rmdir = util.promisify(fs.rmdir)
    let open = util.promisify(fs.open)
    let close = util.promisify(fs.close)
    let readFile = util.promisify(fs.readFile)
    let write = util.promisify(fs.write)

    // open huge database files for writing
    let stringsFd = await open(this.paths.strings, 'w')
    let vectorsFd = await open(this.paths.vectors, 'w')
    let indexFd = await open(this.paths.index, 'w')

    // calculate largest chunk size
    let largestChunk = 0
    for (let num of Object.values(this.recordedPrefixes))
      if (num > largestChunk) largestChunk = num
    // calculate how many bytes we need to count each chunk's length
    let lengthByteSize = (largestChunk < 255) ? 1 : ((largestChunk < 65535) ? 2 : 4)

    // initialise index file
    let header = Buffer.alloc(9)
    header.writeUInt8({sha1: 1, sha256: 2, md5: 3}[this.settings.hashType], 0)
    header.writeUInt16BE(this.hash('test').length, 1)
    header.writeUInt16BE(this.settings.vectorSize, 3) // 
    header.writeUInt8({sint8: 0, sint16: 1, float32: 2}[this.settings.format], 5) // format of vectors
    header.writeUInt8(this.settings.prefixBytes, 6) // how many bytes prefix in index, 1 = 256 entries 2 = 65535 entries
    header.writeUInt8(lengthByteSize, 7) // chunk size
    header.writeUInt8(this.settings.scaling, 8) // scaling - multiplies the resulting numbers to beyond -1.0 to +1.0
    await write(indexFd, header)

    // calculate size of vectors to figure out how far in to each file we are
    let numberSize = {sint8: 1, sint16: 2, float32: 4}[this.settings.format]
    let vectorByteSize = this.settings.vectorSize * numberSize
    let vectorsWritten = 0

    //for (let prefix of Object.keys(this.recordedPrefixes)) {
    let prefixBuffer = Buffer.alloc(this.settings.prefixBytes + 1)
    let max = parseInt("FFFFFFFF".substr(0, this.settings.prefixBytes * 2), 16)
    for (let idxNum = 0; idxNum <= max; idxNum++) {
      if (this.settings.prefixBytes == 1) prefixBuffer.writeUInt8(idxNum, 1)
      else if (this.settings.prefixBytes == 2) prefixBuffer.writeUInt16BE(idxNum, 1)
      else if (this.settings.prefixBytes == 3) prefixBuffer.writeUInt16BE(idxNum, 0)
      else if (this.settings.prefixBytes == 4) prefixBuffer.writeUInt16BE(idxNum, 1)
      else throw new Error("prefixBytes > 4 not supported currently")
      let prefix = prefixBuffer.toString('hex', 1)

      // read in this bucket
      let [vectors, strings] = await Promise.all([
        readFile(path.join(this.paths.temp, `${prefix}-vectors.bin`)),
        readFile(path.join(this.paths.temp, `${prefix}-strings.bin`))
      ])
      
      // build an index entry
      let vectorCount = vectors.length / vectorByteSize
      let entry = Buffer.alloc(lengthByteSize)
      if (lengthByteSize == 1) entry.writeUInt8(vectorCount, 0)
      else if (lengthByteSize == 2) entry.writeUInt16BE(vectorCount, 0)
      else if (lengthByteSize == 4) entry.writeUInt32BE(vectorCount, 0)

      // append it to the large database files
      await Promise.all([
        write(vectorsFd, vectors),
        write(stringsFd, strings),
        write(indexFd, entry)
      ])
      
      vectorsWritten += vectorCount
    }

    // close files
    await Promise.all([stringsFd, vectorsFd, indexFd].map((fd)=> close(fd)))

    // erase temporary files
    let tempFiles = await readdir(this.paths.temp)
    for (let tempFile of tempFiles) await unlink(path.join(this.paths.temp, tempFile))
    await rmdir(this.paths.temp)
    delete this.paths.temp
    delete this.recordedPrefixes
    
    // return how many vectors were compressed in to the big database file
    return vectorsWritten
  }
}

module.exports = VectorLibraryWriter