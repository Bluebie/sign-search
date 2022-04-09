// Static Page Provider produces the body contents of static pages in the site build
const html = require('nanohtml')
const raw = require('nanohtml/raw')
const fs = require('fs-extra')

const base = require('./provider-base')

class StaticPageProvider extends base {
  constructor (pageName) {
    super()
    this.name = pageName
  }

  getPageType () {
    return 'static-page'
  }

  getData () {
    return {
      hook: 'true',
      hashtags: '#hashtags-list'
    }
  }

  async load () {
    if (this.body) return

    const path = require.resolve(`../../static-pages/${this.name}.html`)
    if (await fs.pathExists(path)) {
      this.body = await fs.readFile(path)
    } else {
      throw new Error(`Page ${path} doesn't exist in static-pages`)
    }
  }

  toHTML () {
    return html`<main>
      ${raw(this.body)}
    </main>`
  }
}

module.exports = StaticPageProvider
