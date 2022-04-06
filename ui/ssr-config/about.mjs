import { readFile } from 'fs/promises'
import { parseIndex } from '../../library/search-index.mjs'

export const isLive = true

export async function getProps () {
  const library = parseIndex(await readFile('../datasets/search-index/index.cbor'))

  const tagCounter = {}
  for (const entry of library.index) {
    for (const tag of entry.tags) {
      if (tagCounter[tag] === undefined) tagCounter[tag] = 0
      tagCounter[tag] += 1
    }
  }

  const hashtags = Object.entries(tagCounter).map(([hashtag, count]) => ({ hashtag, count })).sort((a, b) => {
    return b.count - a.count
  })

  return { hashtags }
}
