// Reads FastText .vec text formast word embedding data file line by line and writes it in to
// a binary vector library, indexed by hash of the written word text, organized in to small
// files of about 8-16kb each, which can be efficiently loaded as needed by web clients or
// local apps as needed for each word lookup. By default, each vector's value is stored with
// 8 bits of integer precision, with each vector scaled as needed to fit in to that space.
// Resolution can be adjusted to an arbitrary number of bits below in the resolutionBits constant
// Usage:
//  > node build-indexed-vector-library.js path/to/fasttext-database.vec
const promisify = require('util').promisify
const lineReader = require('line-reader')
const VectorLibraryWriter = require('../lib/vector-library/writer')
const resolutionBits = 8
const shardBits = 16
const maxEntries = 500000

async function run(fasttextPath) {
  console.log(fasttextPath)
  let writer

  let count = 0
  await promisify(lineReader.eachLine)(fasttextPath, function(line, last, cb) {
    if (count >= maxEntries) return
    (async function() {
      let elements = line.toString().replace("\n", '').split(' ')

      if (elements.length == 2) {
        let [totalWords, vectorSize] = elements.map(n => parseInt(n))
        console.log(`Starting transfer from vector library containing ${totalWords} words with vector size of ${vectorSize}`)
        writer = await (new VectorLibraryWriter(
          `../datasets/vectors-${fasttextPath.split('/').slice(-1)[0].replace('.vec', '').replace(/\./g, '-')}-${resolutionBits}bit`,
          {
            vectorBits: resolutionBits,
            // calculate shard bits and prefix bits to try to optimise each shard file size to roughly 15kb or so
            prefixBits: Math.round(shardBits / 2),
            shardBits: Math.round(shardBits),
            vectorSize
          }
        )).open()
      } else {
        let word = elements.shift()
        let vector = elements.map((x)=> parseFloat(x))
        
        await writer.append(word, vector)
        if (count % 1000 == 0) console.log(`count: ${count}, word: ${word}`)
        count++
      }
      cb()
    })()
  })
  
  console.log("Final compression stage beginning...")
  await writer.finish()
  console.log("Word Library Build Complete!")
}

run(process.argv.slice(-1)[0])