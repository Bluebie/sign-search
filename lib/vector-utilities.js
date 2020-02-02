// This is a simple object full of useful vector manipulation functions
const VectorUtils = {
  // add a bunch of vectors together
  add: (...vectors)=> vectors.reduce((a,b)=> a.map((num, idx)=> num + b[idx])),

  // multiply a list of vectors together
  multiply: (list, mul)=>
    list.map((left)=> left.map((n, i)=> n * mul[i])),

  // mean average the vectors together
  mean: (...list)=> VectorUtils.multiply([VectorUtils.add(...list)], VectorUtils.build(1 / list.length, list[0].length))[0],

  // build a new vector, containing value for every entry, with size many dimensions
  build: (value, size)=> {
    let final = []
    for (let i = 0; i < size; i++) final.push(value)
    return final
  },

  // calculate squared Euclidean distance between two vectors, adapted from how tensorflow-js does it
  distanceSquared: (a, b)=> {
    let result = 0
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i]
      result += diff * diff
    }
    return result
  },

  // calculate how different the meaning of the words in the list is from the average of all of them
  // returns an array of distances from the mean
  diversity: (...vectors)=> {
    // skip if there are 0 or 1 vectors
    if (vectors.length <= 1) return [0]
    // first average all the vectors together
    let meanVector = VectorUtils.mean(...vectors)
    // calculate how far from the center point each vector is
    return vectors.map(v => VectorUtils.distanceSquared(v, meanVector))
  },
}

if (typeof(module) == 'object')
  module.exports = VectorUtils