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

  getHeadTags() {
    return []
  }

  getOpenGraph() {
    return {}
  }

  getPaginatorState() {
    return {
      length: 0,
      selected: 0,
      getURL: (idx)=> "#"
    }
  }

  getPageType() {
    return "generic-page"
  }

  toHTML() {
    return html`<!-- No page provider responded to toHTML() -->`
  }
}

module.exports = BaseProvider