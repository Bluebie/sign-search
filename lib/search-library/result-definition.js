// Represents a search result, as returned by SearchLibraryReader
const SearchDefinition = require('./definition')

class SearchResultDefinition extends SearchDefinition {
  constructor(values = {}) {
    super(values)
    this.library = values.library
    this.terms = values.terms || []
    this.termDiversity = values.termDiversity || 0
    this._hash = values.hash
    this._definitionIndex = values.definitionIndex || 0
    this._fetched = values.preloaded || false
  }

  // fetches search result data, if it's not already populated
  async fetch() {
    if (!this._fetched) {
      // fetch the data, and store it to the original SearchResultDefinition in the prototype
      let storage = this.parentSearchResult || this
      let chunk = await this.library._fetchDefinitionData(this)

      storage.title    = chunk.data.title
      storage.keywords = chunk.data.keywords || chunk.data.glossList // TODO: remove depricated fallback
      storage.link     = chunk.data.link
      storage.body     = chunk.data.body
      storage.provider = chunk.data.provider || chunk.data.spider
      storage.id       = chunk.data.id || chunk.data.link
      // augment media with rich object inherting other info from the search library's mediaSets setting, and building the full video path as a url
      storage.media    = chunk.media.map(formats => 
        Object.keys(formats).map(extension => Object.assign(Object.create(this.library.settings.mediaSets.find(media => media.extension == extension) || {}), { url: `${this.library.baseURL}/${formats[extension]}` }) )
      )

      storage._fetched = true
    }

    return this
  }
}

module.exports = SearchResultDefinition