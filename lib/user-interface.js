const SearchEngine = require('./search-engine/engine')
const ResultView = require('./search-engine/view-result')
const Paginator = require('./search-engine/view-paginator')
const html = require('nanohtml')
const morph = require('nanomorph')
const parseDuration = require('parse-duration')
const delay = require('delay')

const qs = (...args)=> document.querySelector(...args)
const qsa = (...args)=> document.querySelectorAll(...args)

class FindSignUI {
  constructor(config) {
    this.config = config
    this.searchEngine = new SearchEngine(config)
  }

  // load datasets
  async load() {
    await this.searchEngine.load()
  }

  // returns a promise, which resolves when data is loaded and search engine is interactive
  awaitReady() { return this.searchEngine.awaitReady() }

  async addHooks() {
    window.onhashchange = ()=> this.onHashChange(location.hash.replace(/^#/, ''))

    qs(this.config.searchForm).onsubmit = event => {
      let queryText = qs(this.config.searchInput).value
      event.preventDefault()
      location.href = `#${encodeURIComponent(queryText)}/0`
    }

    if (location.hash != '' && location.hash != '#') this.onHashChange(location.hash.replace(/^#/, ''))
  }

  onHashChange(hash) {
    if (hash == '') {
      this.renderHome(hash)
    } else {
      this.renderSearch(hash)
    }
  }

  // render homepage
  renderHome(hash) {
    location.hash = "#"
    qs('html > body').className = 'home'
    qs(this.config.resultsContainer).innerHTML = ''
    qs(this.config.paginationContainer).innerHTML = ''
    qs(this.config.searchInput).value = ''
    qs(this.config.searchInput).focus()
    // welcome screenreader users
    //this.ariaNotice("Welcome to Find Sign. Enter a search query", 'polite')
  }

  // render search results page
  async renderSearch(hash) {
    let [queryText, offset] = hash.split('/').map(x => decodeURIComponent(x))

    // ensure search box is correctly filled
    qs(this.config.searchInput).value = queryText

    if (!this.searchEngine.ready) {
      this.visualNotice("Loading…")
    } else {
      // move screenreader attention to just above the results list, also scroll up
      this.ariaNotice("Loading…", "off").focus()
    }
    
    // query the search engine...
    this.results = await this.searchEngine.query(queryText)

    if (this.results.length == 0) {
      return this.visualNotice("No search results found.", 'live')
    } else {
      // update css to page mode
      qs('html > body').className = 'results'

      // clear the views
      qs(this.config.resultsContainer).innerHTML = ''
      qs(this.config.paginationContainer).innerHTML = ''
    }

    // slice out the group to display
    this.displayResults = this.results.slice(parseInt(offset), parseInt(offset) + this.config.resultsPerPage)

    // add all the search result tiles to the results <div>
    let finishedLoading = Promise.all(this.displayResults.map(async (result, index) => {
      // implement the slow tile in effect
      await delay(index * this.config.tileAppendDelay)

      // create a result view
      let view = new ResultView({
        warnings: this.config.warnings,
        onChange: ()=> morph(element, view.toHTML())
      })
      // add the result placeholder to the search results <div>
      let element = view.toHTML()
      qs(this.config.resultsContainer).append(element)

      // wait for search results data to load in and update the search result view
      view.setData(await result.fetch())
    }))

    // wait for all the search results to finish loading in
    await finishedLoading

    // add a paginator
    let paginator = new Paginator({
      length: Math.min(this.results.length / this.config.resultsPerPage, this.config.maxPages),
      selected: Math.floor(parseInt(offset) / this.config.resultsPerPage),
      getURL: (pageNum)=> `#${encodeURIComponent(queryText)}/${pageNum * this.config.resultsPerPage}`
    })

    // update the pagination widget
    morph(qs(this.config.paginationContainer), paginator.toHTML())

    // move screenreader attention to just above the results list, and announce they're ready
    this.ariaNotice("Search results updated.", "off").focus()
  }

  // replaces the content of the page with a notice, which is also read by aria
  visualNotice(text, ariaLive = 'polite') {
    qs('html > body').className = 'notice'
    let resultsBox = qs(this.config.resultsContainer)
    resultsBox.innerHTML = ''
    resultsBox.append(html`<div class="notice_box" aria-live="${ariaLive}">${text}</div>`)
  }

  // creates an invisible aria notice which self destructs when it blurs
  ariaNotice(text, ariaLive = 'polite') {
    [...qsa('div.aria_notice')].forEach(x => x.remove())
    let notice = html`<div class="aria_notice" tabindex="-1" aria-live="${ariaLive}" style="position: absolute; top: -1000px">${text}</div>`
    qs(this.config.resultsContainer).before(notice)
    return notice
  }

  async renderHashtagList(selector) {
    await this.awaitReady()
    let list = qs(selector)
    let tags = await this.searchEngine.getTags()
    // empty the list
    list.innerHTML = ''
    // add list items with links to example tag searches
    for (let tag of Object.keys(tags).sort((a,b)=> tags[b] - tags[a])) {
      list.append(html`<li><a href="${`./#${encodeURIComponent(`#${tag}`)}/0`}">#${tag}</a> (${tags[tag]})</li>`)
    }
  }
}

let ui = window.ui = new FindSignUI({
  languageName: "Auslan",
  searchLibraryPath: "datasets/search-index",
  vectorLibraryPath: "datasets/vectors-cc-en-300-8bit",
  resultsPerPage: 10,
  maxPages: 8,
  homeButton: '#header',
  searchForm: '#search_form',
  searchInput: '#search_box',
  resultsContainer: '#results',
  paginationContainer: '#pagination',
  tileAppendDelay: parseDuration(getComputedStyle(document.documentElement).getPropertyValue('--fade-time-offset').trim()),
  warnings: {
    invented: { type: 'invented', text: "Informal, colloqual sign. Professionals should not use." }
  }
})

// if this is the search engine interface, hook all that stuff up
if (document.body.dataset.hook == 'true') ui.addHooks()
// regardless, load our datasets, we might be on the about page
ui.load()
// if a hashtag list is requested, display it
if (document.body.dataset.hashtagList) ui.renderHashtagList(document.body.dataset.hashtagList)