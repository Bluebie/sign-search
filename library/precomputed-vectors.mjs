// lookup word vectors in precomputed index
import { readJSON, readAllCBOR } from './io.mjs'
import { sha256 } from './hash.mjs'
import { bytesToPrefixBits } from './bits.mjs'
import { chunkIterable } from './times.mjs'
import { unpack } from './packed-vector.mjs'
import { build, multiply } from './vector-utilities.mjs'

/**
 * @typedef {object} VectorLibrary
 * @property {string} path - path to folder containing settings.json and shards
 * @property {Settings} settings - object with config information about the library build and encoding
 */

/**
 * @typedef {object} Settings
 * @property {string} hashFunction - currently always sha256 - for good WebAPI compatibility
 * @property {number} vectorSize - how many dimensions do the vectors have - usually 300
 * @property {number} vectorBits - how many bits represent each dimension of each vector's numeric value
 * @property {number} buildTimestamp - epoch milliseconds when library was computed
 * @property {number} prefixBits - how many bits of the hash are used for a shard prefix folder name
 * @property {number} shardBits - how many bits are overall used for the combo of prefix folder and shard filename
 */

/**
 * Open precomputed vectors library
 * @param {string} path - path or url to base folder containing settings.json and shards
 * @returns {VectorLibrary}
 */
export async function open (path) {
  const settings = await readJSON(`${path}/settings.json`)
  return { path, settings }
}

/**
 * Lookup an open vector library for a specified word, returns either an array of floats (vector) or undefined
 * @param {VectorLibrary} library - returned from open()
 * @param {string} word - a single word, generally lowercase (unless acronym, to lookup
 */
export async function lookup (library, word) {
  const hash = await sha256(word)
  const folder = parseInt(bytesToPrefixBits(hash, library.settings.prefixBits), '2')
  const file = parseInt(bytesToPrefixBits(hash, library.settings.shardBits), '2')
  const shard = await readAllCBOR(`${library.path}/shards/${folder}/${file}.cbor`)
  for (const [entryWord, entryScale, entryPackedVector] of chunkIterable(shard, 3)) {
    if (entryWord === word) {
      const unscaledVector = unpack(entryPackedVector, library.settings.vectorBits, library.settings.vectorSize)
      const scaledVector = multiply([unscaledVector], build(entryScale, unscaledVector.length))[0]
      return scaledVector
    }
  }
}
