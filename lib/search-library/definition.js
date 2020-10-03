// This class represents an entry in the search index
// it provides access to everything the search index encodes, and can load in the search definition data

class SearchDefinition {
  // accepts a fetch function, a tag list, and a word list
  constructor ({ title, keywords, tags, link, nav, media, body, provider, id } = {}) {
    this.title = title || null
    this.keywords = keywords || []
    this.tags = tags || []
    this.link = link || null
    this.nav = nav
    this.media = media || []
    this.body = body || null
    this.provider = provider || null
    this.id = id || null
  }

  get uri () {
    return `${this.provider || 'unknown'}:${this.id || this.link || 'unknown'}`
  }

  inspect () {
    return `<${this.constructor.name} [${this.uri}]: ${this.title || this.keywords.join(', ')}>`
  }

  toJSON () {
    return {
      title: this.title,
      keywords: this.keywords,
      tags: this.tags,
      link: this.link,
      nav: this.nav,
      media: this.media,
      body: this.body,
      provider: this.provider,
      id: this.id
    }
  }
}

module.exports = SearchDefinition
