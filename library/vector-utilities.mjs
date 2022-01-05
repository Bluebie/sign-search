// collection of simple vector math stuff for working with word vectors

// add a list of vectors to each other, making a new vector
export function add (...vectors) {
  return vectors.reduce((a, b) => a.map((num, idx) => num + b[idx]))
}

// multiply a list of vectors together
export function multiply (list, mul) {
  return list.map(left => left.map((n, i) => n * mul[i]))
}

// mean average the vectors together
export function mean (...list) {
  return multiply([add(...list)], build(1 / list.length, list[0].length))[0]
}

// build a new vector, containing value for every entry, with size many dimensions
export function build (value, size) {
  return (new Array(size)).fill(value, 0, size)
}

// calculate squared Euclidean distance between two vectors, adapted from how tensorflow-js does it
export function distanceSquared (a, b) {
  let result = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    result += diff * diff
  }
  return result
}

// calculate how different the meaning of the words in the list is from the average of all of them
// returns an array of distances from the mean
export function diversity (...vectors) {
  // skip if there are 0 or 1 vectors
  if (vectors.length <= 1) return [0]
  // first average all the vectors together
  const meanVector = mean(...vectors)
  // calculate how far from the center point each vector is
  return vectors.map(v => distanceSquared(v, meanVector))
}
