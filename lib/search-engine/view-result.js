const html = require('nanohtml')

class SearchResultPanel {
  // accepts a config object, which includes:
  // warnings: an object whose keys are hashtags, and values are objects in the format { type: 'css class name', text: 'plaintext alert to show to user' }
  // onChange: a function which when executed will call toHTML() and reinsert the component in to the page with updated data
  constructor(config = {}) {
    this.config = config
    this.config.mediaIndex = this.config.mediaIndex || 0
    this.result = null
  }

  setData(resultData) {
    this.result = resultData
    if (this.config.onChange) this.config.onChange(this)
  }

  // get html (DOM elements on browser, string on nodejs) rendering of this search result component
  toHTML() {
    if (this.result) {
      return this.toPopulatedHTML()
    } else {
      return this.toPlaceholderHTML()
    }
  }

  // get an array of warnings to display on this search result
  getWarnings() {
    let triggers = this.config.warnings || {}
    let matches = Object.keys(triggers).filter(tag => this.result.tags.includes(tag))
    return matches.map(tag => this.config.warnings[tag] )
  }

  // get an ID to use with this element
  toID(...path) {
    if (this.result) {
      return ['result', this.result.id, ...path].join('-')
    } else {
      return ''
    }
  }

  toMediaViewer() {
    // onClick handler for arrow buttons on media carousel
    let adjustMedia = (event, adjustment) => {
      event.preventDefault()
      event.stopPropagation()
      this.config.mediaIndex += adjustment
      this.config.onChange(this)
      return false
    }

    // should the previous/next video buttons be visible to the user and visible to screenreader users
    let showPrevBtn = this.config.mediaIndex > 0
    let showNextBtn = this.config.mediaIndex < this.result.media.length - 1
    // get the currently selected piece of media’s source list
    let sources = this.result.media[this.config.mediaIndex]

    // build media viewer DOM
    return html`
    <div class="video_player">
      <picture class="video_thumb" aria-hidden="true" data-nanomorph-component-id="${this.result.id}/media/${this.config.mediaIndex}">
        ${sources.map(source => html`<source srcset="${source.url}" type="${source.type}">` )}
        <video class="video_thumb" muted preload autoplay loop playsinline>
          ${sources.map(source => html`<source src="${source.url}" type="${source.type}">` )}
        </video>
      </picture>
      <button class="prev_vid" aria-label="Previous Video" onclick=${(e)=> adjustMedia(e, -1)} style="${showPrevBtn ? '' : 'display: none'}">${"<"}</button>
      <button class="next_vid" aria-label="Next Video" onclick=${(e)=> adjustMedia(e, +1)} style="${showNextBtn ? '' : 'display: none'}">${">"}</button>
    </div>`
  }

  // build a fully populated search result html thingo
  toPopulatedHTML() {
    let component = html`
    <a class="result" href="${this.result.link}" referrerpolicy="origin" rel="external" id="${this.toID()}" aria-labelledby="${this.toID('keywords')}" role=link>
      ${this.toMediaViewer()}
      <h2 class="keywords" id="${this.toID('keywords')}">${this.result.title || this.result.keywords.join(', ')}</h2>
      <cite class="link">${this.result.link}</cite>
      <div class="tags">${this.result.tags.map(x => `#${x}`).join(' ')}</div>
      ${this.getWarnings().map(warning => html`<div class="alert ${warning.type}">${warning.text}</div>`)}
      <div class="mini_def">${this.result.body}</div>
    </a>`
    return component
  }

  toPlaceholderHTML() {
    return html`<a class="result placeholder" aria-hidden="true"></a>`
  }
}

module.exports = SearchResultPanel