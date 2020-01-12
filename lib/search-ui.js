class SearchUI {
  constructor(config) {
    this.settings = config
    this.ready = false
    this.readyHandlers = []
  }

  // load any necessary stuff
  async setup() {
    this.originalTitle = document.title
    this.onHashChange(window.location.hash) // go to current hash url

    await this.loadDataSources()
    this.ready = true
    this.readyHandlers.forEach(f => f())

    window.addEventListener('hashchange', event => this.onHashChange(window.location.hash))
  }

  // reload the data sources, useful to check cache issues
  async loadDataSources() {
    let newVectorLibraries = {}
    let newSearchLibraries = {}
    await Promise.all([
      // load search libraries
      ...(this.settings.searchLibraries || []).map(name => 
        (async ()=> {
          newSearchLibraries[name] = await (new SearchLibraryReader).open(`${this.settings.datasetsPath}/${name}`)
        })()
      ),
      // technically optional: preload vector libraries
      ...(this.settings.vectorLibraries || []).map(name => 
        (async ()=> {
          newVectorLibraries[name] = await (new VectorLibraryReader).open(`${this.settings.datasetsPath}/${name}`)
        })()
      )
    ])
    // check if we got all the vector libraries we need, as specified by the now loaded search libraries
    let missedVectorLibraries = Object.values(newSearchLibraries).map(x => x.settings.vectorLibrary).filter(x => !!x && !newVectorLibraries[x])
    await Promise.all([...missedVectorLibraries.map(name => 
      (async ()=> {
        newVectorLibraries[name] = await (new VectorLibraryReader).open(`${this.settings.datasetsPath}/${name}`)
      })()
    )])
    
    this.vectorLibraries = newVectorLibraries
    this.searchLibraries = newSearchLibraries
  }

  // resolves a promise when the search library has finished loading
  waitUntilReady() {
    if (this.ready) {
      return Promise.resolve(this)
    } else {
      return new Promise((resolve, reject) => {
        this.readyHandlers.push(()=> resolve(this))
      })
    }
  }

  // runs when the # at the end of the URL changes
  async onHashChange(hash) {
    if (hash == '' || hash == '#') {
      this.setView('home')
    } else {
      let [query, offset] = hash.split('#')[1].split('/').map(x => decodeURIComponent(x))
      $("#search_box").val(query)
      if (!this.ready) this.setView('notice', `Downloading ${this.settings.languageName} Data…`)
      // check every 50ms until ready to process query
      await this.waitUntilReady()
      // render results
      this.setView('results', query, parseInt(offset))
    }
  }

  // go home
  async home() {
    this.settings.searchInput.val('')
    window.location.hash = '#'
  }

  // search for something
  async search(search) {
    if (!this.ready) this.setView('notice', `Downloading ${this.settings.languageName} Data…`)
    // check every 50ms until ready to process query
    await this.waitUntilReady()

    if (search.trim() == "") {
      window.location.hash = ""
    } else {
      window.location.hash = `#${encodeURIComponent(search)}/0`
    }
  }

  // parse a search query, lookup any vectors involved, and return useful structured data
  async parseSearch(search) {
    // split the query in to list of words, and lookup vectors as needed
    let rawTerms = search.trim().split(/[\t\n,?!;:\[\]\(\){} "”“]+/).filter(x => x.toString().trim().length > 0)
    let queryInfo = {
      positiveTags: [], // tags to require
      negativeTags: [], // tags to exclude
      searchTerms: {},
      tokenLength: rawTerms.length, // number of tokens including both terms and hashtags
      termsLength: 0 // number of search terms that aren't hashtags
    }

    // setup the searchTerm collections for each vector library in use
    Object.keys(this.vectorLibraries).forEach(name => queryInfo.searchTerms[name] = [])

    await Promise.all(rawTerms.map(async (rawTerm) => {
      if (rawTerm.match(/^-#([a-zA-Z0-9._-]+)$/)) {
        queryInfo.negativeTags.push(rawTerm.slice(2))
      } else if (rawTerm.match(/^#([a-zA-Z0-9._-]+)$/)) {
        queryInfo.positiveTags.push(rawTerm.slice(1))
      } else {
        queryInfo.termsLength += 1
        let cleanedTerm = rawTerm.trim().replace(/‘/g, "'")
        // if it's not all caps like an acronym, lowercase it
        if (cleanedTerm.match(/^-/)) cleanedTerm = cleanedTerm.slice(1)
        if (cleanedTerm.match(/[a-z]/) || cleanedTerm.length < 2) cleanedTerm = cleanedTerm.toLowerCase()

        await Promise.all(Object.keys(this.vectorLibraries).map(async (vectorLibraryName) => {
          let vectorLibrary = this.vectorLibraries[vectorLibraryName]
          // attempt to look up the term, possibly a capitalised acronym
          let vector = await vectorLibrary.lookup(cleanedTerm)
          // if we found a vector, we can add it to the query terms
          if (vector) {
            if (!rawTerm.match(/^-/)) { // positive query term, add it to the vector
              queryInfo.searchTerms[vectorLibraryName].push(vector)
            } else { // negative query term, subtract it
              queryInfo.searchTerms[vectorLibraryName].push(VU.multiply([vector], VU.build(-1, vector.length))[0])
            }
          } else { // otherwise we'll have to just treat it as a plaintext query
            if (!rawTerm.match(/^-/)) {
              queryInfo.searchTerms[vectorLibraryName].push(cleanedTerm)
            } else {
              let negativeTerm = `${cleanedTerm}`
              negativeTerm.weight = -1.0 // TODO: make this do something in the SearchLibraryReader
              queryInfo.searchTerms[vectorLibraryName].push(negativeTerm)
            }
          }
        }))
      }
    }))

    return queryInfo
  }

  //////// UI code \\\\\\\\
  async setView(view, ...args) {
    document.body.className = view
    this.settings.resultsContainer.empty()
    this.settings.paginationContainer.empty()
    window.scrollTo(0,0)
    await this[`${view}ViewRender`].call(this, ...args)
  }

  async homeViewRender() {
    // no-op
  }

  async resultsViewRender(search, pageOffset = 0) {
    document.title = `“${search}” — ${this.originalTitle}`
    window.location.hash = `#${[search, pageOffset].map(x => encodeURIComponent(x)).join('/')}`
    
    let querySets = await this.parseSearch(search)

    // generate results table
    let resultsLists = []
    if (querySets.termsLength > 0) {
      // for each search term, query the search libraries and rank on their best matching term (min mode)
      resultsLists = (await Promise.all(Object.values(this.searchLibraries).map(searchLibrary =>
        querySets.searchTerms[searchLibrary.settings.vectorLibrary].map(term =>
          // get the raw results based purely on term matching
          searchLibrary.lookup([term], { sort: false, rankMode: 'min' })
        )
      ).flat())).flat()
    } else {
      // we're just doing a tags search, so just grab the whole index
      resultsLists = (await Promise.all(Object.values(this.searchLibraries).map(searchLibrary => searchLibrary.lookup([]) ))).flat()
    }
        
    // filter on tags
    let resultsTable = {}
    for (let result of resultsLists) {
      if (querySets.positiveTags.every(tag => result.entity.tags.includes(tag))
      && querySets.negativeTags.every(antitag => !result.entity.tags.includes(antitag))) {
        // collect all the results for each term query and add their distances together
        let longID = `${result.library.name}/${result.id}`
        if (!resultsTable[longID]) resultsTable[longID] = result
        else resultsTable[longID].distance += result.distance
      }
    }

    // try to downrank phrase-type results a bit in single word queries in preference to single word/concept listings
    let searchResults = Object.values(resultsTable)
    if (querySets.searchTerms[this.settings.vectorLibraries[0]].length == 1
    && typeof(querySets.searchTerms[this.settings.vectorLibraries[0]][0]) != 'string') {
      searchResults.forEach(result => {
        result.distance += result.entity.termDiversity / 500
      })
    }
    
    // sort our results by relevance
    searchResults = searchResults.sort((a,b)=> a.distance - b.distance)
    
    // render the results
    if (searchResults.length < 1) return this.setView('notice', `No results found`)
    let displayResults = searchResults.slice(pageOffset, pageOffset + this.settings.resultsPerPage)
    window.displayResults = displayResults

    try {
      let loadingList = []
      for (let result of displayResults) {
        loadingList.push((async ()=> {
          let resultLink = this.buildResultPlaceholder()
          resultLink.attr('data-idx', `${searchResults.indexOf(result)}`)
          resultLink.appendTo(this.settings.resultsContainer)
          let {data, media} = await result.library.fetchDef(result)
          this.buildResult({targetElement: resultLink, result, data, media})
        })())
        await (new Promise((resolve) => setTimeout(resolve, this.settings.tileAppendDelay * 1000 )))
      }
      
      // update the pagination display
      let pages = Math.min(this.settings.maxPages, Math.ceil(searchResults.length / this.settings.resultsPerPage))
      for (let pageID = 1; pageID <= pages; pageID++) {
        let pageButton = $(`<a aria-label="Page ${pageID}">${pageID}</button>`)
        pageButton.attr('href', `#${encodeURIComponent(search)}/${encodeURIComponent((pageID - 1) * this.settings.resultsPerPage)}`)
        if (pageOffset / this.settings.resultsPerPage == pageID - 1) {
          pageButton.attr('aria-current', 'true')
        }
        pageButton.appendTo(this.settings.paginationContainer)
      }

      await Promise.all(loadingList)
      this.ariaNotice("Search results updated.", "off").focus()
    } catch (e) {
      console.error(e)
      this.setView('notice', `Error loading results: ${e}`)
    }
  }

  // generate a notice that is visible to all users, which replaces any results
  async noticeViewRender(message, ariaLive = 'polite') {
    $("#results").empty().append($('<div>').text(message).attr('aria-live', ariaLive))
  }
  
  // generate a notice that is only visible to screen readers
  ariaNotice(message, ariaLive = 'polite') {
    $("#aria-notice").remove()
    let newNotice = $('<div id="aria-notice" tabindex="-1">').text(message).attr('aria-live', ariaLive).css({"position":"absolute", "top": "-1000px"})
    this.settings.resultsContainer.before(newNotice)
    return newNotice
  }
  
  // build a placeholder blank result
  buildResultPlaceholder() {
    return $('<a class="result" referrerpolicy="origin" rel="external"></a>')
  }

  // build a result which has data available
  buildResult({targetElement, selectedVariation = 0, media, result, data}) {
    let variations = media.length
    targetElement.empty()
    targetElement.attr('href', data.link)
    let videoWidget = $('<div class="video_player" data-current="0" aria-hidden="true">')
    videoWidget.appendTo(targetElement)

    // build video player, preferring to render with a picture tag on browsers that support it
    // (currently only Apple WebKit powered ones...)
    let pictureTag = $('<picture class="video_thumb"></picture>')
    let videoTag = $('<video class="video_thumb" muted preload autoplay loop playsinline></video>')
    let mediaItem = media[selectedVariation]
    mediaItem.forEach(format => {
      $('<source></source>').attr('srcset', format.url).attr('type', format.type).appendTo(pictureTag)
      $('<source></source>').attr('src', format.url).attr('type', format.type).appendTo(videoTag)
    })
    videoTag.appendTo(pictureTag)
    pictureTag.appendTo(videoWidget)

    // if needed, add previous and next video buttons
    if (selectedVariation > 0) {
      let prevButton = $('<button class="prev_vid" aria-label="Previous Variation Video">&lt;</button>')
      prevButton.appendTo(videoWidget)
      prevButton.on('click', (event)=> {
        event.preventDefault()
        this.buildResult({targetElement, selectedVariation: selectedVariation - 1, media, result, data})
      })
    }
    if (selectedVariation < variations - 1) {
      let nextButton = $('<button class="next_vid" aria-label="Next Variation Video">&gt;</button>')
      nextButton.appendTo(videoWidget)
      nextButton.on('click', (event)=> {
        event.preventDefault()
        this.buildResult({targetElement, selectedVariation: selectedVariation + 1, media, result, data})
      })
    }

    targetElement.append($('<div class="gloss_list"></div>').text(data.glossList.join(", ")))
    targetElement.append($('<div class="link"></div>').text(data.link))
    targetElement.append($('<div class="tags"></div>').text(result.entity.tags.map(x => `#${x}`).join(' ')))
    for (let alert of Object.keys(this.settings.tagAlerts)) {
      if (result.entity.tags.includes(alert)) {
        targetElement.append($('<div class="alert"></div>').text(this.settings.tagAlerts[alert].text))
        targetElement.addClass(this.settings.tagAlerts[alert].class)
      }
    }
    targetElement.append($('<div class="mini_def"></div>').text(data.body || ""))
  }

  // gets set of hashtags
  async getTags() {
    await this.waitUntilReady()

    let tags = {}
    Object.values(this.searchLibraries).forEach(library => {
      let libTags = library.getTags()
      Object.keys(libTags).forEach(tag => tags[tag] = (tags[tag] || 0) + libTags[tag])
    })
    return tags
  }
}



window.ui = new SearchUI({
  languageName: "Auslan",
  datasetsPath: "datasets",
  vectorLibraries: ["vectors-cc-en-300-8bit"],
  searchLibraries: ["asphyxia", "youtube", "signbank", "stage-left", "toddslan", "v-alford"],
  resultsPerPage: 10,
  maxPages: 8,
  searchForm: $('#search_form'),
  searchInput: $('#search_box'),
  resultsContainer: $('#results'),
  paginationContainer: $('#pagination'),
  tileAppendDelay: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fade-time-offset').trim()),
  tagAlerts: {
    'invented': { class: 'invented', text: "Informal, colloqual sign. Professionals should not use." }
  }
})

$("img#header").click((e)=> {
  // if this is a search page, handle it internally
  if ($('#search_form').length > 0) {
    e.preventDefault()
    ui.home()
  }
})

$("#search_form").submit((e)=> {
  e.preventDefault()
  ui.search($('#search_box').val())
})

ui.setup()