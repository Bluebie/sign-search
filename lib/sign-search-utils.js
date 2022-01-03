// general utilities library of useful functions that get reused a lot
let assert = (condition, statement) => {
  if (!condition) throw new Error(statement)
}
try {
  assert = require('assert')
} catch (err) {
  // no assert available
}

const Util = {
  // encode a (positive or 0) integer to a binary string
  intToBits: (number, size) => {
    assert(!Number.isNaN(number), 'Number is NaN! Cannot encode to int')
    assert(number === Math.round(number), 'Number must be a whole number')
    assert(number >= 0, 'Number is negative! Cannot encode to int')
    const encoded = number.toString(2)
    assert(encoded.length <= size, `Input number ${number} too large to fit in ${size} digits with binary encoding`)
    return ('0').repeat(size - encoded.length) + encoded
  },

  // decode a binary string in to a positive or 0 integer
  bitsToInt: (binaryString) => {
    assert(binaryString.match(/^[01]+$/), 'String contains characters that are not binary')
    assert(binaryString.length <= 53, 'String is too long to parse in to a single int reliably')
    return parseInt(binaryString, 2)
  },

  // encode a signed int to a set number of bits using 2's compliment encoding
  sintToBits: (number, size) => {
    assert(size >= 2, 'Size cannot be under 2')
    assert(!Number.isNaN(number), 'Number is NaN! Cannot encode to signed int')
    assert(number === Math.round(number), 'Number must be a whole number')
    assert(number < 2 ** (size - 1), 'Number is too small to fit in the specified size')
    assert(number > 0 - (2 ** (size - 1)), 'Number is too large to fit in the specified size')
    const trueNumberSize = size - 1
    const encoded = Math.abs(number).toString(2)
    assert(encoded.length <= trueNumberSize)
    return (number < 0 ? '1' : '0') + ('0').repeat(trueNumberSize - encoded.length) + encoded
  },

  // decode binary string in to a signed integer
  bitsToSint: (binaryString) => {
    assert(binaryString.match(/^[01]+$/), 'String contains characters that are not binary')
    assert(binaryString.length <= 53, 'String is too long to parse in to a single signed int reliably')
    const compliment = binaryString.slice(0, 1)
    const numericBits = binaryString.slice(1)
    const absolute = parseInt(numericBits, 2)
    return compliment === '0' ? +absolute : -absolute
  },

  // encode a byte array to a binary string
  bytesToBits: (byteArray) => {
    return Array.from(byteArray, x => Util.intToBits(x, 8)).join('')
  },

  bitsToBytes: (binaryString) => {
    assert(binaryString.length % 8 === 0, 'Binary string input must be a multiple of 8 characters')
    return Array.from(Util.chunkIterable(binaryString, 8), chunk => Util.bitsToInt(chunk))
  },

  // like bytesToBits, but only returns the specified number of prefix bits
  bytesToPrefixBits: (byteArray, prefixBitLength = 0) => {
    return Util.bytesToBits(byteArray.slice(0, Math.ceil(prefixBitLength / 8))).slice(0, prefixBitLength)
  },

  // convert a byte array in to a lowercase base16 representation
  bytesToBase16: (byteArray) => {
    return Array.from(byteArray, num => bytesToBase16Table[num]).join('')
  },

  base16ToBytes: (base16String) => {
    assert(base16String.length % 2 === 0, 'Base 16 String input must be a multiple of 2 characters')
    return new Uint8Array(Array.from(Util.chunkIterable(base16String, 2), nibble => parseInt(nibble, 16)))
  },

  // pack a set of floats in the -1.0 to +1.0 range in to ints with arbitrary precision
  packFloats: (floats, bitPrecision) => {
    const sints = floats.map(num => Math.round(num * ((2 ** (bitPrecision - 1) - 1))))
    let bits = sints.map(sint => Util.sintToBits(sint, bitPrecision)).join('')
    if (bits.length % 8 !== 0) bits += ('0').repeat(8 - (bits.length % 8))
    return Util.bitsToBytes(bits)
  },

  // unpack a series of arbitrary precision floats (truly fixed point numbers) from a set of bytes (i.e. word vectors)
  unpackFloats: (bytes, bitPrecision, totalFloats) => {
    const bits = Util.bytesToBits(bytes)
    return Util.timesMap(totalFloats, index => {
      const sint = Util.bitsToSint(bits.slice(index * bitPrecision, (index + 1) * bitPrecision))
      return sint / ((2 ** (bitPrecision - 1)) - 1)
    })
  },

  // Object conversion stuff

  // accepts an object with base16 keys and any values
  // returns a Map with Uint8Array keys and values copied in
  base16ObjectToUint8Map: (object) => {
    return Util.objectToMap(object, (keyString) => new Uint8Array(Util.base16ToBytes(keyString)))
  },

  // accepts an object as input, and uses an optional keyMap function to transform the keys in to
  // any other format, then builds a map using that format and returns it
  objectToMap: (object, keyMapFn = (x) => x, valueMapFn = (x) => x) => {
    const map = new Map()
    for (const propertyName in object) {
      map.set(keyMapFn(propertyName), valueMapFn(object[propertyName]))
    }
    return map
  },

  // encode/decode a buffer (like that returned by fetch) in to a regular string
  // returns a promise
  encodeUTF8: (string) => {
    if (!this._utf8_encoder) this._utf8_encoder = new TextEncoder('utf-8')
    return this._utf8_encoder.encode(string)
  },

  decodeUTF8: (buffer) => {
    if (!this._utf8_decoder) this._utf8_decoder = new TextDecoder('utf-8')
    return this._utf8_decoder.decode(buffer)
  },

  // execute a callback x many times
  times: (times, callback) => {
    const iter = Util.timesMapIterable(times, callback)
    while (iter.next().done !== true) {
      // noop
    }
  },

  // a set number of times, a callback is called with (index, times), returning a regular Array of the return values
  timesMap: (times, callback) => {
    return Array.from(Util.timesMapIterable(times, callback))
  },

  // returns an iterable which calls a callback with (index, times) `times` many times, returning the results of the callback
  timesMapIterable: function * (times, callback) {
    if (times < 1) return

    let index = 0
    while (index < times) {
      yield callback(index, times)
      index += 1
    }
  },

  // given a sliceable object like an Array, Buffer, or String, returns an array of slices, chunkSize large, up to maxChunks or the whole thing
  // the last chunk may not be full size
  chunk: (sliceable, chunkSize, maxChunks = Infinity) => {
    return Array.from(Util.chunkIterable(sliceable, chunkSize, maxChunks))
  },

  // iterable version, takes an iterable as input, and provides an iterable as output with entries grouped in to arrays
  // strings as inputs are a special case: you get strings as output (concatinating the characters together)
  chunkIterable: function * (sliceable, chunkSize, maxChunks = Infinity) {
    const input = sliceable[Symbol.iterator]()
    while (maxChunks > 0) {
      const chunk = []
      while (chunk.length < chunkSize) {
        const output = input.next()
        if (output.done) {
          if (chunk.length > 0) yield (typeof sliceable === 'string') ? chunk.join('') : chunk
          return
        } else {
          chunk.push(output.value)
        }
      }
      yield (typeof sliceable === 'string') ? chunk.join('') : chunk
      maxChunks -= 1
    }
  },

  // some common browser thingies
  fetchLikeFile: async (path) => {
    const data = await window.fetch(path, { mode: 'same-origin', credentials: 'omit' })
    if (!data.ok) throw new Error(`Server responded with error code! "${data.status}" while loading "${path}" Search Library`)
    return Buffer.from(await data.arrayBuffer())
  },

  // simplified digests of short buffers
  digestOnWeb: async (algo, data) => {
    const algos = { sha1: 'SHA-1', sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' }
    algo = algos[algo] || algo
    return new Uint8Array(await window.crypto.subtle.digest(algo, data))
  }
}

const bytesToBase16Table = Util.timesMap(2 ** 8, (number) =>
  ('00' + number.toString(16).toLowerCase()).slice(-2)
)

module.exports = Util
