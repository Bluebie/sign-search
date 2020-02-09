// Paginator widget generates a list of page buttons with one selected
const fsutil = require('../sign-search-utils')
const html = require('nanohtml')

class PaginatorComponent {
  // construct a paginator view
  // accepts a config object:
  //   length: (default 1) total number of pages to display
  //   selected: (default 0) zero indexed currently selected page
  //   getURL: (default `?page=${pageNum}`) a function, which is given a page number, and returns a url to that page
  constructor(config) {
    this.config = {
      // defaults
      length: 1, // if length is zero, paginator will be empty (effectively hidden)
      selected: 0,
      getURL: (x)=> `?page=${x}`,
      getLabel: (x)=> `${x + 1}`,
      getAriaLabel: (x)=> `Go to page ${x + 1}`,
      // override with passed in stuff
      ... config || {}
    }
  }

  getSelector() {
    return "nav#pagination"
  }

  toHTML() {
    return html`
    <nav id="pagination">
      ${fsutil.timesMap(this.config.length, (n) => {
        if (this.config.selected == n) {
          return html`<a href=${this.config.getURL(n)} aria-label=${this.config.getAriaLabel(n)} aria-current=page>${this.config.getLabel(n)}</a>`
        } else {
          return html`<a href=${this.config.getURL(n)} aria-label=${this.config.getAriaLabel(n)}>${this.config.getLabel(n)}</a>`
        }
      })}
    </nav>`
  }
}

module.exports = PaginatorComponent