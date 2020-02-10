// Static Page Provider produces the body contents of static pages in the site build
const html = require('nanohtml')
const base = require('./provider-base')
const ResultTile = require('./component-result-tile')

const signSearchConfig = require('../../package.json').signSearch

class ErrorPageProvider extends base {
  constructor(state) {
    super()
    this.state = state
  }

  getPageType() {
    return "search-results"
  }

  getData() {
    return { hook: "true" }
  }

  getPaginatorState() {
    return {
      length: Math.min(signSearchConfig.resultsMaxPages, Math.ceil(this.state.results.length / signSearchConfig.resultsPerPage)),
      selected: Math.floor(this.state.offset / signSearchConfig.resultsPerPage),
      getURL: (pageNum) => {
        let params = {
          query: this.state.query,
          offset: pageNum * signSearchConfig.resultsPerPage
        }
        return `?${Object.entries(params).map(([k,v])=> `${k}=${encodeURIComponent(v)}`).join('&')}`
      }
    }
  }

  async load() {
    let offset = this.state.offset
    let length = signSearchConfig.resultsPerPage
    this.resultsSlice = this.state.results.slice(offset, offset + length)
    this.resultTiles = await Promise.all(this.resultsSlice.map(async result => {
      let view = new ResultTile({
        warnings: [],//this.config.warnings,
        result: result,
      })

      // wait for search results data to load in and update the search result view
      view.setData(await result.fetch())

      return view
    }))
  }

  toHTML() {
    return html`<main>${this.resultTiles.map(x => x.toHTML())}</main>`
  }
}

module.exports = ErrorPageProvider