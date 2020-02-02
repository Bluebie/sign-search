const html = require('nanohtml')

class BaseProvider {
  async load() {
    return null
  }
  
  getConfig() {
    return {}
  }
  
  getData() {
    return {}
  }

  getPageType() {
    return "generic-page"
  }

  toHTML() {
    return html`<!-- No page provider responded to toHTML() -->`
  }
}

module.exports = BaseProvider