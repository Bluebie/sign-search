// Static Page Provider produces the body contents of static pages in the site build
const html = require('nanohtml')
const base = require('./provider-base')

class ErrorPageProvider extends base {
  constructor (message) {
    super()
    this.message = message
  }

  getPageType () {
    return 'notice'
  }

  getData () {
    return { hook: 'true' }
  }

  toHTML () {
    return html`<main><div class="notice-box">${this.message}</div></main>`
  }
}

module.exports = ErrorPageProvider
