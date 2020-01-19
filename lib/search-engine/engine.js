const SearchLibraryReader = require('../search-library/reader')
const VectorLibraryReader = require('../vector-library/reader')
const SearchQuery = require('./query')

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
        (new SearchLibraryReader()).open(this.config.searchLibraryPath),
        (new VectorLibraryReader()).open(this.config.vectorLibraryPath)
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

    // query the search index for these keywords (both vectors and plaintext)
    let results = await this.searchLibrary.lookup(query.keywords.map(x => x.toQuery()), { sort: false, rankMode: 'add' })

    // filter results for hashtag matching
    let positiveTags = query.hashtags.filter(x =>  x.positive).map(x => x.text)
    let negativeTags = query.hashtags.filter(x => !x.positive).map(x => x.text)
    results = results.filter(result => 
      positiveTags.every(tag => result.entity.tags.includes(tag)) && !negativeTags.some(tag => result.entity.tags.includes(tag))
    )

    // implement termDiversity adjustment to slightly push down phrases relative to perfect matches
    results.forEach(result => {
      result.distance += result.termDiversity / 500
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