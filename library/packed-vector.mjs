// functions for dealing with packed vectors
import { sintToBits, bitsToSint, bitsToBytes, bytesToBits } from './bits.mjs'
import { timesMap } from './times.mjs'

// pack a set of floats in the -1.0 to +1.0 range in to ints with arbitrary precision
export function pack (floats, bitPrecision) {
  const sints = floats.map(num => Math.round(num * ((2 ** (bitPrecision - 1) - 1))))
  let bits = sints.map(sint => sintToBits(sint, bitPrecision)).join('')
  if (bits.length % 8 !== 0) bits += ('0').repeat(8 - (bits.length % 8))
  return bitsToBytes(bits)
}

// unpack a series of arbitrary precision floats (truly fixed point numbers) from a set of bytes (i.e. word vectors)
export function unpack (bytes, bitPrecision, totalFloats) {
  const bits = bytesToBits(bytes)
  return timesMap(totalFloats, index => {
    const sint = bitsToSint(bits.slice(index * bitPrecision, (index + 1) * bitPrecision))
    return sint / ((2 ** (bitPrecision - 1)) - 1)
  })
}

// some common browser thingies
// export async function fetchLikeFile (path) {
//   const data = await window.fetch(path, { mode: 'same-origin', credentials: 'omit' })
//   if (!data.ok) throw new Error(`Server responded with error code! "${data.status}" while loading "${path}" Search Library`)
//   return Buffer.from(await data.arrayBuffer())
// }

// simplified digests of short buffers
// export async function digestOnWeb (algo, data) {
//   const algos = { sha1: 'SHA-1', sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' }
//   algo = algos[algo] || algo
//   return new Uint8Array(await window.crypto.subtle.digest(algo, data))
// }
