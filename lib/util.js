// general utilities library of useful functions that get reused a lot
const assert = require('assert')

let Util = {
  // convert a Buffer, UInt8Array, or regular array of integers, to a string of '1' and '0' characters
  bytesToBits: (byteArray)=> {
    if (!this._bytes2bits_lookup) {
      this._bytes2bits_lookup = (new Array(2 ** 8)).fill(0).map((_, number)=>
        ('0'.repeat(8) + number.toString(2)).slice(-8)
      )
    }

    return [...new Uint8Array(byteArray)].map((value)=> {
      assert(value >= 0 && value <= 255, "Values must fit within 0-255 inclusive")
      return this._bytes2bits_lookup[value]
    }).join('')
  },

  // like bytesToBits, but only returns the specified number of prefix bits
  bytesToPrefixBits: (byteArray, prefixBitLength = 0) => {
    return Util.bytesToBits(byteArray.slice(0, Math.ceil(prefixBitLength / 8))).slice(0, prefixBitLength)
  },

  // convert a byte array in to a lowercase base16 representation
  bytesToBase16: (byteArray) => {
    return Array.from(new Uint8Array(byteArray)).map((num)=> `0${num.toString('16')}`.substr(-2)).join('').toLowerCase()
  },

  // decode a buffer (like that returned by fetch) in to a regular string
  decodeUTF8: (buffer) => {
    if (!this._utf8_decoder) this._utf8_decoder = new TextDecoder('utf-8')
    return this._utf8_decoder.decode(buffer)
  },

  // execute a callback x many times
  times: (times, callback) => {
    let index = 0
    while (index < times) {
      callback(index, times)
      index += 1
    }
  },

  // a set number of times, a callback is called with (index, times), returning a regular Array of the return values
  timesMap: (times, callback) => {
    return [...Util.timesMapIterable(times, callback)]
  },

  // returns an iterable which calls a callback with (index, times) `times` many times, returning the results of the callback
  timesMapIterable: function *(times, callback) {
    let index = 0
    while (index < times) {
      yield callback(index, times)
      index += 1
    }
  },

  // given a sliceable object like an Array, Buffer, or String, returns an array of slices, chunkSize large, up to maxChunks or the whole thing
  // the last chunk may not be full size
  chunkMap: (sliceable, chunkSize, maxChunks = null) => {
    let totalChunks = Math.min(maxChunks || Infinity, Math.ceil(sliceable.length / chunkSize))
    return Util.timesMap(totalChunks, (index)=>
      sliceable.slice(index * chunkSize, Math.min((index + 1) * chunkSize, sliceable.length))
    )
  }
}

module.exports = Util