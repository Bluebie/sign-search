import { decode as decodeCBOR, iter_decode as iterateCBOR } from 'cbor-codec/esm/index.mjs'

const { fetch, Request, Response, Headers } = globalThis
export { fetch, Request, Response, Headers }

export { decodeCBOR, iterateCBOR }

/**
 * Given a url/path, read the resource and decode it as CBOR
 * @param {string} url
 * @returns {any}
 */
export async function readCBOR (url) {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return decodeCBOR(arrayBuffer)
}

/**
 * Given a url/path, read the resource and decodes it as an async iterable
 * @param {string} url
 * @returns {Array}
 */
export async function readAllCBOR (url) {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return [...iterateCBOR(arrayBuffer)]
}

/**
 * Given a url/path, read the resource and decode it as JSON
 * @param {string} url
 * @returns {any}
 */
export async function readJSON (url) {
  const response = await fetch(url)
  return await response.json()
}
