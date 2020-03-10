// Represents a search result, as returned by SearchLibraryReader
const SearchDefinition = require('./definition')
const Util = require('../sign-search-utils')

class SearchResultDefinition extends SearchDefinition {
  constructor(values = {}) {
    super(values)
    this.library = values.library
    this.terms = values.terms || []
    this.termDiversity = values.termDiversity || 0
    if (values.hash) {
      this._hash = values.hash
      this._hashString = Util.bytesToBase16(values.hash)
    }
    this._definitionPath = values.definitionPath
    this._fetched = values.preloaded || false
  }

  isFetched() { return this._fetched }

  // fetches search result data, if it's not already populated
  // returns a promise resolving when it loaded
  async fetch() {
    if (this._fetched) return this
    // fetch the data, and store it to the original SearchResultDefinition in the prototype
    let chunk = await this.library._fetchDefinitionData(this)

    this.title    = chunk.title
    this.keywords = chunk.keywords
    this.tags     = chunk.tags
    this.link     = chunk.link
    this.nav      = chunk.nav
    this.body     = chunk.body
    this.provider = chunk.provider
    this.id       = chunk.id || chunk.link
    // augment media with rich object inherting other info from the search library's mediaSets setting, and building the full video path as a url
    this.media    = chunk.media.map(formats => 
      Object.keys(formats).map(extension => Object.assign(Object.create(this.library.settings.mediaSets.find(media => media.extension == extension) || {}), { url: `${this.library.webURL}/media/${formats[extension]}` }) )
    )

    this._fetched = true
    return this
  }
}

module.exports = SearchResultDefinition
