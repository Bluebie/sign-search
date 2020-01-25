// Reads FastText .vec text formast word embedding data file line by line and writes it in to
// a binary vector library, indexed by hash of the written word text, organized in to small
// files of about 8-16kb each, which can be efficiently loaded as needed by web clients or
// local apps as needed for each word lookup. By default, each vector's value is stored with
// 8 bits of integer precision, with each vector scaled as needed to fit in to that space.
// Resolution can be adjusted to an arbitrary number of bits below in the resolutionBits constant
// Usage:
//  > node build-indexed-vector-library.js path/to/fasttext-database.vec
const promisify = require('util').promisify
const crypto = require('crypto')
const fs = require('fs-extra')
const zlib = require('zlib')
const byline = require('byline')
const ProgressBar = require('progress')
const VectorLibrary = require('../lib/vector-library/library')
const vectorBits = 8
const prefixBits = 7
const shardBits = 14
const maxEntries = 500_000


async function run(fasttextPath) {
  console.log(fasttextPath)
  let writer

  // open the supplied ascii fasttext model
  let inputFile = fs.createReadStream(fasttextPath)
  // if it's still gzipped, use zlib to stream unzip it along the way
  if (fasttextPath.match(/\.gz$/)) {
    let unzip = zlib.createGunzip()
    inputFile = inputFile.pipe(unzip)
  }
  // now pipe it through byline to get lines out
  let lineStream = byline.createStream(inputFile)

  let count = 0
  var progress = new ProgressBar(' [:bar] :rate/wps :percent :etas :word', {
    total: maxEntries, width: 80, head: '>', incomplete: ' ', clear: true
  })
  for await (let line of lineStream) {
    if (count >= maxEntries) {
      lineStream.destroy()
      progress.terminate()
      continue
    } else {
      let elements = line.toString().replace("\n", '').split(' ')
      
      if (elements.length == 2) {
        let [totalWords, vectorSize] = elements.map(n => parseInt(n))
        console.log(`Starting transfer from vector library containing ${totalWords} words with vector size of ${vectorSize}`)
        writer = new VectorLibrary({
          path: `../datasets/word-vectors-${fasttextPath.split('/').slice(-1)[0].replace('.vec', '').replace('.gz', '').replace(/\./g, '-')}-${vectorBits}bit`,
          fs, vectorSize, prefixBits, shardBits, vectorBits,
          digest: async (algo, data) => {
            let hash = crypto.createHash(algo)
            hash.update(data)
            return new Uint8Array(hash.digest())
          },
          textFilter: (text) => {
            if (text.length > 1 && text.match(/^[A-Z0-9]$/)) return text.trim()
            return text.trim().toLowerCase()
          }
        })
      } else {
        let word = elements.shift()
        let vector = elements.map((x)=> parseFloat(x))
        
        await writer.addDefinition(word, vector)
        if (count % 1000 == 0) progress.interrupt(`count: ${count}, word: ${word}`)
        count += 1
        progress.tick({ word })
      }
    }
  }
  
  console.log("Finishing up...")
  await writer.save()
  console.log("Vector Library Build Complete!")
}

run(process.argv.slice(-1)[0])