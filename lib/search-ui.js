class SearchUI {
  constructor(config) {
    this.settings = config
    this.ready = false
  }

  // load any necessary stuff
  async setup() {
    this.originalTitle = document.title
    this.onHashChange(window.location.hash) // go to current hash url

    await this.loadDataSources()
    this.ready = true

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
    // let missedVectorLibraries = Object.values(newSearchLibraries).map(x => x.settings.vectorLibrary).filter(x => !!x && !newVectorLibraries[x])
    // await Promise.all([...missedVectorLibraries.map(name => 
    //   (async ()=> {
    //     newVectorLibraries[name] = await (new VectorLibraryReader).open(`${this.settings.datasetsPath}/${name}`)
    //   })()
    // )])
    
    this.vectorLibraries = newVectorLibraries
    this.searchLibraries = newSearchLibraries
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
      while (!this.ready) {
        await (new Promise((resolve, reject) => setTimeout(()=> resolve(), 50)))
      }
      // render results
      this.setView('results', query, parseInt(offset))
    }
  }

  search(search) {
    window.location.hash = `#${encodeURIComponent(search)}/0`
  }

  // parse a search query, lookup any vectors involved, and return useful structured data
  async parseSearch(search) {
    // split the query in to list of words, and lookup vectors as needed
    let rawTerms = search.trim().split(/[\t\n,.?!;:\[\]\(\){} "”“]+/).filter(x => x.toString().trim().length > 0)
    let queryInfo = {
      positiveTags: [], // tags to require
      negativeTags: [], // tags to exclude
      searchTerms: {}
    }

    // setup the searchTerm collections for each vector library in use
    Object.keys(this.vectorLibraries).forEach(name => queryInfo.searchTerms[name] = [])

    await Promise.all(rawTerms.map(async (rawTerm) => {
      if (rawTerm.match(/^-#([a-zA-Z0-9-_]+)$/)) {
        queryInfo.negativeTags.push(rawTerm.slice(2))
      } else if (rawTerm.match(/^#([a-zA-Z0-9-_]+)$/)) {
        queryInfo.positiveTags.push(rawTerm.slice(1))
      } else {
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

    // for each search term, query the search libraries and rank on their best matching term (min mode)
    let resultsTable = {}
    await Promise.all(Object.values(this.searchLibraries).map(async searchLibrary => {
      await Promise.all(querySets.searchTerms[/*searchLibrary.settings.vectorLibrary.name ||*/ this.settings.vectorLibraries[0].name].map(async term => {
        // get the raw results based purely on term matching
        let rawResults = searchLibrary.lookup([searchTerm], { sort: false, rankMode: 'min' })
        // filter for hashtags
        for (let result of rawResults) {
          if (querySets.positiveTags.every(tag => result.entity.tags.includes(tag))
          && querySets.negativeTags.every(antitag => !result.entity.tags.includes(antitag))) {
            // collect all the results for each term query and add their distances together
            let longID = `${result.library.name}/${result.id}`
            if (!resultsTable[longID]) resultsTable[longID] = result
            else resultsTable[longID].distance += result.distance
          }
        }
      }))
    }))
    
    // sort our results by relevance
    let searchResults = Object.keys(resultsTable).sort((a,b)=> a.distance - b.distance)
    
    // render the results
    if (searchResults.length < 1) return this.setView('notice', `No results found`)
    let displayResults = searchResults.slice(pageOffset, pageOffset + this.settings.resultsPerPage)

    try {
      let loadingList = []
      for (let result of displayResults) {
        loadingList.push((async ()=> {
          let resultLink = this.buildResultPlaceholder()
          resultLink.attr('data-idx', `${searchResults.indexOf(result)}`)
          resultLink.appendTo(this.settings.resultsContainer)
          let {variations, data} = await result.library.fetchDef(result)
          this.buildResult({targetElement: resultLink, variations, result, data})
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
  buildResult({targetElement, selectedVariation = 0, variations = 1, result, data}) {
    targetElement.empty()
    targetElement.attr('href', data.link)
    let videoWidget = $('<div class="video_player" data-current="0" aria-hidden="true">')
    videoWidget.appendTo(targetElement)


    // TODO: add support for different formats
    let videoPlayer = $({
      picture: `<img class="video_thumb">`,
      video: `<video class="video_thumb" muted preload autoplay loop playsinline></video>`
    }[this.settings.videoRenderMode])
    videoPlayer.attr('src', result.library.videoLink(result, selectedVariation))
    videoPlayer.appendTo(videoWidget)

    // if needed, add previous and next video buttons
    if (selectedVariation > 0) {
      let prevButton = $('<button class="prev_vid" aria-label="Previous Variation Video">&lt;</button>')
      prevButton.appendTo(videoWidget)
      prevButton.on('click', (event)=> {
        event.preventDefault()
        this.buildResult({targetElement, selectedVariation: selectedVariation - 1, variations, result, data})
      })
    }
    if (selectedVariation < variations - 1) {
      let nextButton = $('<button class="next_vid" aria-label="Next Variation Video">&gt;</button>')
      nextButton.appendTo(videoWidget)
      nextButton.on('click', (event)=> {
        event.preventDefault()
        this.buildResult({targetElement, selectedVariation: selectedVariation + 1, variations, result, data})
      })
    }

    targetElement.append($('<div class="gloss_list"></div>').text(data.glossList.join(", ")))
    targetElement.append($('<div class="link"></div>').text(data.link))
    targetElement.append($('<div class="tags"></div>').text(result.entity.tags.map(x => `#${x}`).join(' ')))
    targetElement.append($('<div class="mini_def"></div>').text(data.body || ""))
  }


}