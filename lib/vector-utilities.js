// This is a simple object full of useful vector manipulation functions
const VU = {
  // add a bunch of vectors together
  add: (...vectors)=> vectors.reduce((a,b)=> a.map((num, idx)=> num + b[idx])),

  // multiply a list of vectors together
  multiply: (list, mul)=>
    list.map((left)=> left.map((n, i)=> n * mul[i])),

  // mean average the vectors together
  mean: (...list)=> VU.multiply([VU.add(...list)], VU.build(1 / list.length, list[0].length)),

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
  }
}

if (typeof(module) == 'object')
  module.exports = VU