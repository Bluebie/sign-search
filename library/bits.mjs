import { chunkIterable } from './times.mjs'

// encode a (positive or 0) integer to a binary string
export function intToBits (number, size) {
  const encoded = number.toString(2)
  return ('0').repeat(size - encoded.length) + encoded
}

// decode a binary string in to a positive or 0 integer
export function bitsToInt (binaryString) {
  return parseInt(binaryString, 2)
}

// encode a signed int to a set number of bits using 2's compliment encoding
export function sintToBits (number, size) {
  const trueNumberSize = size - 1
  const encoded = Math.abs(number).toString(2)
  return (number < 0 ? '1' : '0') + ('0').repeat(trueNumberSize - encoded.length) + encoded
}

// decode binary string in to a signed integer
export function bitsToSint (binaryString) {
  const compliment = binaryString.slice(0, 1)
  const numericBits = binaryString.slice(1)
  const absolute = parseInt(numericBits, 2)
  return compliment === '0' ? +absolute : -absolute
}

// encode a byte array to a binary string
export function bytesToBits (byteArray) {
  return Array.from(byteArray, x => intToBits(x, 8)).join('')
}

export function bitsToBytes (binaryString) {
  return Array.from(chunkIterable(binaryString, 8), chunk => bitsToInt(chunk))
}

// like bytesToBits, but only returns the specified number of prefix bits
export function bytesToPrefixBits (byteArray, prefixBitLength = 0) {
  return bytesToBits(byteArray.slice(0, Math.ceil(prefixBitLength / 8))).slice(0, prefixBitLength)
}
