const SearchLibrary = require('../search-library/library-web')
const VectorLibrary = require('../vector-library/library')
const SearchQuery = require('./query')
const VU = require('../vector-utilities')
const fsutil = require('../util')

class SearchEngine {
  // requires a config object containing:
  //   searchLibraryPath: path to search library directory
  //   vectorLibraryPath: path to vector library directory
  constructor(config) {
    this.ready = false
    this.readyHandlers = []
    this.config = config
  }

  // load the necessary index data to be ready to accept queries
  async load() {
    try {
      [this.searchLibrary, this.vectorLibrary] = await Promise.all([
        (new SearchLibrary({ path: this.config.searchLibraryPath })).open(),
        (new VectorLibrary({
          path: this.config.vectorLibraryPath,
          fs: { readFile: fsutil.fetchLikeFile },
          digest: fsutil.digestOnWeb
        })).open()
      ])
    } catch (err) {
      this.readyHandlers.forEach(([resolve, reject]) => reject(err))
      this.readyHandlers = []
      throw err
    }
    this.ready = true
    this.readyHandlers.forEach(([resolve, reject]) => resolve(this))
    this.readyHandlers = []
  }

  // returns a promise which resolves once the search engine is fully loaded and ready to accept queries
  awaitReady() {
    if (this.ready) {
      return Promise.resolve(this)
    } else {
      return new Promise((resolve, reject) => {
        this.readyHandlers.push([resolve, reject])
      })
    }
  }

  // returns a list of search result objects, which can be passed to @fetch to asyncronously load search result presentation information
  async query(queryText) {
    await this.awaitReady()

    // parse the query search input text in to tokens
    let query = new SearchQuery(queryText)
    // lookup every keyword and replace it with a word vector if possible
    await query.vectorize(this.vectorLibrary)

    // filter results for hashtag matching
    let positiveTags = query.hashtags.filter(x =>  x.positive).map(x => x.text)
    let negativeTags = query.hashtags.filter(x => !x.positive).map(x => x.text)
    // query the search index for these keywords (both vectors and plaintext)
    let results = await this.searchLibrary.query((result)=> {
      if (positiveTags.some(tag => !result.tags.includes(tag))) return false // exclude non matching positive tags
      if (negativeTags.some(tag => result.tags.includes(tag))) return false // exclude if any antitags match

      let distances = query.keywords.map(queryTerm =>
        // return the best match of the query terms against each result term
        Math.min(...result.terms.map(resultTerm => queryTerm.distance(resultTerm)))
      )

      // add the distances together for each result term
      let addedDistances = distances.reduce((x,y)=> x + y, 0)
      // calculate a final distance by adding term diversity score
      return addedDistances + (result.termDiversity / 500)
    })

    // sort results and return them
    return results.sort((a,b) => a.distance - b.distance)
  }

  // returns an object, with hashtag text labels as keys, and integers as values, the integer is the total number of search results featuring that hashtag
  async getTags() {
    await this.awaitReady()
    return this.searchLibrary.getTags()
  }
}

module.exports = SearchEngine