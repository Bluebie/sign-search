const SearchEngine = require('./search-engine/engine')
const ResultTile = require('./views/component-result-tile')
const Paginator = require('./views/component-paginator')
const icon = require('./views/component-icon.js')
const html = require('nanohtml')
const morph = require('nanomorph')
const parseDuration = require('parse-duration')
const delay = require('delay')
const signSearchConfig = require('../package.json')

const qs = (...args) => document.querySelector(...args)
const qsa = (...args) => document.querySelectorAll(...args)

class FindSignUI {
  constructor (config) {
    this.config = config
    this.searchEngine = new SearchEngine(config)

    // export useful stuff
    this.ResultTile = ResultTile
    this.Paginator = Paginator
    this.icon = icon
    this.html = html
    this.morph = morph
  }

  // load datasets
  async load () {
    await this.searchEngine.load()
  }

  // returns a promise, which resolves when data is loaded and search engine is interactive
  awaitReady () { return this.searchEngine.awaitReady() }

  async addHooks () {
    window.onhashchange = () => this.onHashChange(window.location.hash.replace(/^#/, ''))

    qs(this.config.searchForm).onsubmit = event => {
      const queryText = qs(this.config.searchInput).value
      event.preventDefault()
      window.location.href = `#${encodeURIComponent(queryText)}/0`
    }

    if (window.location.hash !== '' && window.location.hash !== '#') {
      this.onHashChange(window.location.hash.replace(/^#/, ''))
    }
  }

  onHashChange (hash) {
    if (hash === '') {
      this.renderHome(hash)
    } else {
      this.renderSearch(hash)
    }
  }

  // render homepage
  renderHome (hash) {
    window.location.hash = '#'
    qs('html > body').className = 'home'
    this.empty()
    qs(this.config.searchInput).value = ''
    qs(this.config.searchInput).focus()
    // welcome screenreader users
    this.loadingNotice('Loading Data…', 'live')
  }

  // render search results page
  async renderSearch (hash) {
    const [queryText, offset] = hash.split('/').map(x => decodeURIComponent(x))
    if (queryText.trim().length === 0) return (window.location.href = '#')

    // empty the page
    this.empty()

    // ensure search box is correctly filled
    qs(this.config.searchInput).value = queryText

    // move screenreader's attention above search results, and notify user something is happening
    this.ariaNotice('Loading…', 'off').focus()

    // setup a loding indicator to display if the results take more than a moment to load
    const loadingIndicatorTimer = setTimeout(() => this.loadingNotice('Loading…', 'off'), 100)

    // query the search engine...
    this.results = await this.searchEngine.query(queryText)

    clearTimeout(loadingIndicatorTimer)
    this.empty()

    if (this.results.length === 0) {
      return this.visualNotice('No search results found.', 'live')
    } else {
      // update css to page mode
      qs('html > body').className = 'search-results'
    }

    // slice out the group to display
    this.displayResults = this.results.slice(parseInt(offset), parseInt(offset) + this.config.resultsPerPage)

    // add all the search result tiles to the results <div>
    const finishedLoading = Promise.all(this.displayResults.map(async (result, index) => {
      // implement the slow tile in effect
      await delay(index * this.config.tileAppendDelay)

      // create a result view
      const view = new ResultTile({
        warnings: this.config.warnings,
        result: result,
        onChange: () => morph(element, view.toHTML())
      })

      // add the result placeholder to the search results <div>
      const element = view.toHTML()
      qs(this.config.resultsContainer).append(element)

      // if the result is low rank, add a low rank warning
      if (this.config.lowRankWarning && result.distance > this.config.lowRankWarning.threshold) {
        view.addWarning(this.config.lowRankWarning)
      }

      // wait for search results data to load in and update the search result view
      view.setData(await result.fetch())
    }))

    // wait for all the search results to finish loading in
    await finishedLoading

    // add a paginator
    const paginator = new Paginator({
      length: Math.min(this.results.length / this.config.resultsPerPage, this.config.maxPages),
      selected: Math.floor(parseInt(offset) / this.config.resultsPerPage),
      getURL: (pageNum) => `#${encodeURIComponent(queryText)}/${pageNum * this.config.resultsPerPage}`,
      getLabel: (n) => (n >= 0 && n < 9) ? icon(`${n + 1}`) : `${n + 1}`
    })

    // update the pagination widget
    morph(qs(this.config.paginationContainer), paginator.toHTML())

    // move screenreader attention to just above the results list, and announce they're ready
    this.ariaNotice('Search results updated.', 'off').focus()
  }

  empty () {
    // clear the views
    morph(qs(this.config.paginationContainer), html`<nav id="pagination"></nav>`)
    morph(qs(this.config.resultsContainer), html`<main></main>`)
  }

  // replaces the content of the page with a notice, which is also read by aria
  visualNotice (text, ariaLive) {
    qs('html > body').className = 'notice'
    morph(qs(this.config.paginationContainer), html`<nav id="pagination"></nav>`)
    morph(qs(this.config.resultsContainer), html`<main id="results"><div class="notice-box" aria-live="${ariaLive || 'polite'}">${text}</div></main>`)
  }

  loadingNotice (text, ariaLive) {
    this.visualNotice(html`<span class="animated-spinner" aria-hidden="true"></span> ${text}`, ariaLive)
  }

  // creates an invisible aria notice which self destructs when it blurs
  ariaNotice (text, ariaLive = 'polite') {
    [...qsa('div.aria-notice')].forEach(x => x.remove())
    const notice = html`<div class="aria-notice" tabindex="-1" aria-live="${ariaLive}" style="position: absolute; top: -1000px">${text}</div>`
    qs(this.config.resultsContainer).before(notice)
    return notice
  }

  // renders a list of popular hashtags, used on the about page
  async renderHashtagList (selector) {
    await this.awaitReady()
    const list = qs(selector)
    if (!list) {
      return // don't try to add hashtags if the element is missing
    }
    const tags = await this.searchEngine.getTags()
    // empty the list
    list.innerHTML = ''
    // add list items with links to example tag searches
    for (const tag of Object.keys(tags).sort((a, b) => tags[b] - tags[a])) {
      list.append(html`<li><a href="${`./#${encodeURIComponent(`#${tag}`)}/0`}">#${tag}</a> <span class="deemphasis">(${tags[tag]})</span></li>`)
    }
  }
}

const ui = window.ui = new FindSignUI({
  languageName: signSearchConfig.signSearch.signLang,
  searchLibraryPath: 'datasets/search-index',
  vectorLibraryPath: 'datasets/cc-en-300-8bit',
  resultsPerPage: 10,
  maxPages: 8,
  homeButton: '#header',
  searchForm: '#search-form',
  searchInput: '#search-box',
  resultsContainer: 'main',
  paginationContainer: '#pagination',
  tileAppendDelay: parseDuration(window.getComputedStyle(document.documentElement).getPropertyValue('--fade-time-offset').trim()),
  warnings: {
    invented: { type: 'invented', text: 'Informal, colloqual sign. Professionals should not use.' },
    homesign: { type: 'home-sign', text: 'This is listed as a Home Sign, not an established widespread part of Auslan.' },
    'home-sign': { type: 'home-sign', text: 'This is listed as a Home Sign, not an established widespread part of Auslan.' }
  }
})

// if this is the search engine interface, hook all that stuff up
if (document.body.dataset.hook === 'true') ui.addHooks()
// regardless, load our datasets, we might be on the about page
ui.load()
// if a hashtag list is requested, display it
if (document.body.dataset.hashtags) {
  ui.renderHashtagList(document.body.dataset.hashtags)
}
