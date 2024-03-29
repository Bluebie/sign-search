// augments search-index with rank properties, and sorts by rank

/**
 * @typedef {object} RankedLibrary
 * @extends import('./search-index.mjs').Library
 * @property {RankedEntry[]} index
 */

/**
 * @typedef {object} RankedEntry
 * @extends import('./search-index.mjs').LibraryEntry
 * @property {number} rank - lower is better
 */

/**
 *
 * @param {import('./search-index.mjs').Library} library - from search-index.open()
 * @param {function} filterFn - given a library index entry, return a number (distance) or false to exclude result
 * @returns {RankedLibrary}
 */
export default function rank (library, filterFn) {
  const rankedLibrary = Object.create(library)
  rankedLibrary.index = library.index.flatMap(entry => {
    const rank = filterFn(entry)
    if (typeof rank === 'number' && rank < Infinity) {
      const rankedEntry = Object.create(entry)
      rankedEntry.rank = rank + (rankedEntry.diversity * 0.05)
      return [rankedEntry]
    } else {
      return []
    }
  }).sort((x, y) => {
    return x.rank - y.rank
  })
  return rankedLibrary
}
