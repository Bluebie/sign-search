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
  decodeUTF8: (buffer)=> {
    if (!this._utf8_decoder) this._utf8_decoder = new TextDecoder('utf-8')
    return this._utf8_decoder.decode(buffer)
  }
}

module.exports = Util