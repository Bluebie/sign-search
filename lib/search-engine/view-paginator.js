// Paginator widget generates a list of page buttons with one selected

const html = require('nanohtml')

class PaginatorComponent {
  // construct a paginator view
  // accepts a config object:
  //   length: (default 1) total number of pages to display
  //   selected: (default 0) zero indexed currently selected page
  //   getURL: (default `?page=${pageNum}`) a function, which is given a page number, and returns a url to that page
  constructor(config) {
    this.length = config.length || 1
    this.selected = config.selected || 0
    this.getURL = config.getURL || ((x)=> `?page=${x}`)
  }

  // simple reimplementation of Ruby's Integer.times method
  timesMap(times, fn) {
    if (times <= 0) return []
    let result = []
    for (let i = 0; i < times; i++) {
      result.push(fn(i))
    }
    return result
  }

  toHTML() {
    return html`
    <div id="pagination">
      ${this.timesMap(this.length, (n) =>
        html`<a href="${this.getURL(n)}" aria-label="Page ${n + 1}" aria-current="${this.selected == n ? "page" : ""}">${n + 1}</a>`
      )}
    </div>`
  }
}

module.exports = PaginatorComponent