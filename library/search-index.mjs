// tree shakable functions for consuming sign-search search indexes
import { unpack } from './packed-vector.mjs'
import { diversity as vectorDiversity } from './vector-utilities.mjs'
import { chunk } from './times.mjs'
import { readCBOR, fetch, Headers, decodeCBOR } from './io.mjs'

/**
 * @typedef {object} Library
 * @property {string} path - path to search index root folder, that is the folder containing index.cbor
 * @property {LibraryEntry[]} index - array of LibraryEntry objects, comprising the search index
 */

/**
 * @typedef {object} LibraryEntry
 * @property {EntryWord[]} words - wordvecs and strings, the searchable terms
 * @property {string[]} tags - hashtags, without the hash prefix
 * @property {number} diversity - number representing how similar the wordvecs in .words are
 * @property {string} path
 */

/**
 * @typedef {number[300]|string} EntryWord
 */

/**
 * open a path, getting a Library
 * @param {string} path
 * @async
 * @returns {Library}
 */
export async function open (path) {
  return await freshen({ path })
}

/**
 * Given a library, check server for a more up to date version, and if available, load it
 * @param {Library} library
 * @async
 * @returns {Library}
 */
export async function freshen (library) {
  const headers = new Headers()
  if (library.etag || library.lastModified) {
    if (library.etag) headers.append('If-None-Match', library.etag)
    if (library.lastModified) headers.append('If-Modified-Since', library.lastModified)
  }

  const response = await fetch(`${library.path}/index.cbor`, { headers, mode: 'same-origin' })
  if (response.status === 304) return library
  else if (response.status !== 200) console.warn('server response weird', response)

  const { settings, symbols, index } = decodeCBOR(await response.arrayBuffer())
  if (settings.version !== 4) throw new Error('Unsupported dataset format version')

  // decode symbols
  symbols.forEach((value, index) => {
    if (typeof value !== 'string') {
      // byte arrays need to be decoded in to float array word vectors
      symbols[index] = unpack(value, settings.vectorBits, settings.vectorSize)
    }
  })

  return {
    path: library.path,
    settings,
    tags: new Set(Object.keys(index).flatMap(x => x.split(',').map(id => symbols[id]))),
    index: Object.entries(index).flatMap(([tagSymbols, entries]) => {
      const tags = tagSymbols.split(',').map(id => symbols[id])
      return Object.entries(entries).flatMap(([wordSymbols, paths]) => {
        const words = wordSymbols.split(',').map(id => symbols[id])
        const diversity = Math.max(...vectorDiversity(...words.filter(x => typeof x !== 'string')))
        return chunk(paths, 2).map(path => {
          return { words, tags, diversity, path }
        })
      })
    }),
    etag: response.headers.get('ETag'),
    lastModified: response.headers.get('Last-Modified')
  }
}

/**
 * Given a LibraryEntry, load the search index result data and return it
 * @param {Library} library - library returned from open()
 * @param {LibraryEntry} entry - entry from library.index to load result data for
 * @async
 * @returns {object}
 */
export async function getResult (library, entry) {
  // calculate url, load shard file, decode it
  const [shardNumber, item] = entry.path
  const shardURL = `${library.path}/definitions/${library.settings.buildID}/${shardNumber}.cbor`
  const shard = await readCBOR(shardURL)
  return {
    library,
    ...shard[item],
    media: shard[item].media.map(paths => {
      return library.settings.mediaSets.map(mediaSet => {
        const path = paths[mediaSet.extension]
        const src = `${library.path}/media/${path}`
        return Object.assign(Object.create(mediaSet), { path, src })
      })
    })
  }
}
