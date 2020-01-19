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

  toMediaViewer() {
    // onClick handler for arrow buttons on media carousel
    let adjustMedia = (event, adjustment) => {
      event.preventDefault()
      event.stopPropagation()
      this.config.mediaIndex += adjustment
      this.config.onChange(this)
      return false
    }

    // build media viewer DOM
    return html`
    <div class="video_player" data-nanomorph-component-id="${this.result.id}/media/${this.config.mediaIndex}">
      <picture class="video_thumb" aria-hidden=true>
        ${this.result.media[this.config.mediaIndex].map(source => 
          html`<source srcset="${source.url}" type="${source.type}">`
        )}
        <video class="video_thumb" muted preload autoplay loop playsinline>
          ${this.result.media[this.config.mediaIndex].map(source => 
            html`<source src="${source.url}" type="${source.type}">`
          )}
        </video>
      </picture>
      ${this.config.mediaIndex > 0 ? html`<button class="prev_vid" aria-label="Previous Video" onclick=${(e)=> adjustMedia(e, -1)}>${"<"}</button>` : null}
      ${this.config.mediaIndex < this.result.media.length - 1 ? html`<button class="next_vid" aria-label="Next Video" onclick=${(e)=> adjustMedia(e, +1)}>${">"}</button>` : null}
    </div>`
  }

  // build a fully populated search result html thingo
  toPopulatedHTML() {
    let component = html`
    <a class="result" href="${this.result.link}" referrerpolicy="origin" rel="external">
      ${this.toMediaViewer()}
      <h2 class="keywords">${this.result.title}</h2>
      <div class="link">${this.result.link}</div>
      <div class="tags">${this.result.tags.map(x => `#${x}`).join(' ')}</div>
      ${this.getWarnings().map(warning => html`<div class="alert ${warning.type}">${warning.text}</div>`)}
      <div class="mini_def">${this.result.body}</div>
    </a>`
    return component
  }

  toPlaceholderHTML() {
    return html`<a class="result placeholder" referrerpolicy="origin" rel="external"></a>`
  }
}

module.exports = SearchResultPanel