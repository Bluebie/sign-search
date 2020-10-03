const html = require('nanohtml')
const icon = require('./component-icon')
const MapComponent = require('./component-map')

class SearchResultTile {
  // accepts a config object, which includes:
  // warnings: an object whose keys are hashtags, and values are objects in the format { type: 'css class name', text: 'plaintext alert to show to user' }
  // onChange: a function which when executed will call toHTML() and reinsert the component in to the page with updated data
  constructor (config = {}) {
    this.config = config
    this.config.mediaIndex = this.config.mediaIndex || 0
    this.result = config.result || null
    this.forcedWarnings = []
  }

  setData (resultData) {
    this.result = resultData
    if (this.config.onChange) this.config.onChange(this)
  }

  addWarning ({ type, text }) {
    this.forcedWarnings.push({ type, text })
    if (this.config.onChange) this.config.onChange(this)
  }

  removeWarning (type) {
    this.forcedWarnings = this.forcedWarnings.filter(warning => warning.type !== type)
    if (this.config.onChange) this.config.onChange(this)
  }

  // get html (DOM elements on browser, string on nodejs) rendering of this search result component
  toHTML () {
    if (this.result && this.result.isFetched()) {
      return this.toPopulatedHTML()
    } else {
      return this.toPlaceholderHTML()
    }
  }

  // get an array of warnings to display on this search result
  getWarnings () {
    const triggers = this.config.warnings || {}
    const matches = Object.keys(triggers).filter(tag => this.result.tags.includes(tag))
    return [...matches.map(tag => triggers[tag]), ...this.forcedWarnings]
  }

  // get an ID to use with this element
  toID (...path) {
    if (this.result) {
      return ['result', this.result.provider, this.result.id, ...path].join('-')
    } else {
      return ''
    }
  }

  toMediaViewer () {
    // onClick handler for arrow buttons on media carousel
    const adjustMedia = (event, adjustment) => {
      event.preventDefault()
      event.stopPropagation()
      this.config.mediaIndex += adjustment
      this.config.onChange(this)
      return false
    }

    // should the previous/next video buttons be visible to the user and visible to screenreader users
    const showPrevBtn = this.config.mediaIndex > 0
    const showNextBtn = this.config.mediaIndex < this.result.media.length - 1
    // get the currently selected piece of media’s source list
    const sources = this.result.media[this.config.mediaIndex]

    // disabled picture element code:
    // <picture class="video-thumb" aria-hidden="true">
    //   ${sources.map(source => html`<source srcset="${source.url}" type="${source.type}">` )}
    // </picture>

    // build media viewer DOM
    return html`
    <div class="video-player" data-nanomorph-component-id="${this.result.id}/media/${this.config.mediaIndex}">
      <a href="${this.result.link}" referrerpolicy="origin" rel="external">
        <video class="video-thumb" muted preload autoplay loop playsinline>
          ${sources.map(source => html`<source src="${source.url}" type="${source.type}">`)}
        </video>
      </a>
      <button class="prev-vid" aria-label="Previous Video" onclick=${e => adjustMedia(e, -1)} style="${showPrevBtn ? '' : 'display: none'}">${'❮'}</button>
      <button class="next-vid" aria-label="Next Video" onclick=${e => adjustMedia(e, +1)} style="${showNextBtn ? '' : 'display: none'}">${'❯'}</button>
    </div>`
  }

  // build a fully populated search result html thingo
  toPopulatedHTML () {
    const component = html`
    <div class="result ${this.getWarnings().map(x => x.type).join(' ')}" id="${this.toID()}">
      ${this.toMediaViewer()}
      ${MapComponent.htmlForRegions(this.result.tags)}
      <h2 class="keywords"><a href="${this.result.link}" referrerpolicy="origin" rel="external">${this.result.title || this.result.keywords.join(', ')}</a></h2>
      <cite class="link">
        ${this.result.nav && this.result.nav.length > 0
          ? this.result.nav.map(([name, url]) => html`<a href="${url}">${name}</a>`)
          : html`<a href="${this.result.link}">${this.result.link}</a>`
        }
      </cite>
      <div class="tags">${this.result.tags.map(x => `#${x}`).join(' ')}</div>
      ${this.getWarnings().map(warning => html`<div class="alert ${warning.type}">${icon(warning.icon || 'alert')} ${warning.text}</div>`)}
      <div class="body">${this.result.body}</div>
    </div>`
    return component
  }

  toPlaceholderHTML () {
    return html`<div class="result placeholder ${this.getWarnings().map(x => x.type).join(' ')}" aria-hidden="true"></div>`
  }
}

module.exports = SearchResultTile
