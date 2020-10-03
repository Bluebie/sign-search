const VU = require('../vector-utilities')

// Parses text search strings and returns structured data describing the tokens in the query like hashtags and keywords
class SearchQuery {
  constructor (queryText) {
    // tokenise search string in to individual pieces
    this.rawTokens = queryText.trim().split(/[\t\n,?!;:[\](){} "”“]+/).filter(x => x.toString().trim().length > 0)

    // map each piece in to a token object
    this.tokens = this.rawTokens.map((rawToken) => {
      if (rawToken.match(/^-#([a-zA-Z0-9._-]+)$/)) {
        return new HashtagToken(rawToken.slice(2), false)
      } else if (rawToken.match(/^#([a-zA-Z0-9._-]+)$/)) {
        return new HashtagToken(rawToken.slice(1), true)
      } else {
        // normalise unicode apostrophes in to ascii apostrophes
        let cleanedTerm = rawToken.trim().replace(/‘/g, "'")
        // if the keyword contains any lower case letters (not an acronym), or is a single letter, lowercase it
        if (cleanedTerm.match(/[a-z]/) || cleanedTerm.length < 2) cleanedTerm = cleanedTerm.toLowerCase()

        return new KeywordToken(cleanedTerm)
      }
    })
  }

  // transforms keywords in to Word Vectors
  async vectorize (vectorLibrary) {
    this.tokens = await Promise.all(this.tokens.map(async (token) => {
      if (token.constructor === KeywordToken) {
        const vector = await vectorLibrary.lookup(token.toString())
        if (vector) {
          return new WordVector(token, vector)
        } else {
          return token
        }
      } else {
        return token
      }
    }))
    return this
  }

  // get an array of keywords in the search query
  get keywords () {
    return this.tokens.filter(token => (token.constructor === KeywordToken || token.constructor === WordVector))
  }

  // get an array of hashtags in the search query
  get hashtags () {
    return this.tokens.filter(token => token.constructor === HashtagToken)
  }

  // build an equivilent query to what was originally queried from the structured data
  toString () {
    return this.tokens.join(' ')
  }
}

// represents a parsed hashtag
class HashtagToken {
  constructor (text, positive = true) {
    this.text = text.toString()
    this.positive = !!positive
  }

  toString () { return `${this.positive ? '#' : '-#'}${this.text}` }
}

// represents a plaintext keyword
class KeywordToken {
  constructor (text) {
    this.text = text.toString()
  }

  // return vector distance (fudged, because this keyword lacks a vector)
  distance (term) {
    if (typeof term === 'string' && term === this.text) {
      return 0
    } else if (typeof term === 'string' && term.toLowerCase() === this.text.toLowerCase()) {
      return 0.1
    } else {
      return 10
    }
  }

  // convert to text for display
  toString () { return this.text }
  // convert to the format used by SearchLibraryReader lookups
  toQuery () { return this.text }
}

// represents a word vector, the output of the SearchQuery#vectorize method
class WordVector {
  constructor (text, vector) {
    this.text = text.toString()
    this.vector = vector
  }

  // return vector distance
  distance (term) {
    if (Array.isArray(term)) {
      return VU.distanceSquared(this.vector, term)
    } else {
      return 10
    }
  }

  // convert to text for display
  toString () { return this.text }
  // convert to the format used by SearchLibraryReader lookups
  toQuery () { return this.vector }
}

SearchQuery.HashtagToken = HashtagToken
SearchQuery.KeywordToken = KeywordToken
SearchQuery.WordVector = WordVector

module.exports = SearchQuery
