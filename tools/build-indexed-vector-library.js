// Compresses word2vec json lists in to a pair of labels and binary compressed vectors in
// big endian 32-bit floats 
const fs = require('fs')
const readlines = require('n-readlines')
const VectorLibraryWriter = require('../lib/vector-library/vector-library-writer')
const encoding = 'utf8'

async function run(fasttextPath) {
  let lineReader = new readlines(fasttextPath)
  let writer = await (new VectorLibraryWriter(
    '../datasets/vector-library',
    {format: 'sint16', scaling: 8} // scaling factor can probably be lower
    // also trialing sint8 would be worthwhile to increase compression at cost to accuracy
  )).open()

  let line
  let count = 0
  while (line = lineReader.next()) {
    let elements = line.toString().replace("\n", '').split(' ')
    if (elements.length == 2) {
      let totalWords = parseInt(elements[0])
      console.log(`Starting transfer of ${totalWords} words`)
    } else {
      let word = elements.shift()
      let vector = elements.map((x)=> parseFloat(x))
      
      await writer.append(word.toLowerCase(), vector)
      if (count % 250 == 0) console.log(`count: ${count}, word: ${word}`)
      count++
    }
  }
  console.log("Final compression stage beginning...")
  await writer.finish()
  console.log("Word Library Build Complete!")
}

run(process.argv.slice(-1)[0])