// import { default as $ } from './jquery.module.js'
// import { SignLibraryReader } from './sign-library/sign-library-reader.js'
// import { VectorLibraryReader } from './vector-library/vector-library-reader.js'
// import * as VectorUtilities from './vector-utilities.js'

var sources = [
  {id: 'asphyxia', name: 'Asphyxia’s Learn Auslan'},
  {id: 'youtube', name: 'Youtube'},
  {id: 'auslan-signbank', name: 'Auslan Signbank'},
  {id: 'auslan-stage-left', name: 'Auslan Stage Left'}
]

var vectorLibrary
var signLibraries = []
var searchResults = []
var pageOffset = 0
var resultsShown = 10
var activeView = 'home'
var readyForQuery = false
var queryWaiting = false
var originalTitle = document.title

// looks up values from the stylesheet
let getStyleSetting = (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim()

async function setup() {
  if (window.location.hash.length > 1) {
    $("#search_box").val(decodeURIComponent(window.location.hash.split('#')[1].split('/')[0]))
    setView('notice', 'Downloading Auslan Data...', 'data-downloading')
  }

  $("#search_form").submit((event)=> {
    event.preventDefault() // don't reload the page!!
    $("#search_box").blur() // unfocus please, for the benefit of mobile devices

    // if the databases are ready to run the query, run it now,
    // otherwise, note it for later and display loading indicator
    if (readyForQuery) {
      runQuery($("#search_box").val())
    } else {
      setView('notice', "Downloading Auslan Data...", 'data-downloading')
      queryWaiting = $("#search_box").val()
    }
  })

  // load all our libraries in, in parallel
  let loading = [
    (new VectorLibraryReader).open('datasets/vector-library'),
    ...sources.map((source)=>
      (new SearchLibraryReader).open(`datasets/${source.id}`)
    )
  ]
  signLibraries = await Promise.all(loading)
  vectorLibrary = signLibraries.shift()

  readyForQuery = true

  // make header in to a link home
  $("img#header").click(()=> { $("#search_box").val(''); setView('home') })

  // watch hash changes
  window.onhashchange = ()=> goHash(window.location.hash)

  if (queryWaiting) {
    $("#search_box").val(queryWaiting)
    runQuery(queryWaiting, pageOffset)
  }

  if (window.location.hash.length > 1) {
    goHash(window.location.hash)
    setView('notice', 'Downloading Auslan Data...', 'data-downloading')
  } else {
    setView('home')
  }
}

// navigate to a page that is specified in url hash format
function goHash(hash) {
  if (hash == '' || hash == '#') {
    setView('home')
  } else {
    let [query, offset] = hash.split('#')[1].split('/').map(x => decodeURIComponent(x))
    if (query != lastQuery || parseInt(offset) != pageOffset) runQuery(query, parseInt(offset))
    $("#search_box").val(query)
  }
}


// when a query is entered, lookup the word vector, find related signs, and display them on the page
var lastQuery;
async function runQuery(search, start = 0) {
  pageOffset = start || 0
  searchResults = []
  lastQuery = search
  document.title = `“${search}” — ${originalTitle}`
  
  // split the query in to list of words, and lookup vectors as needed
  // TODO: This could probably be sped up by running the vectorLibrary lookups in parallel, or always using lowercase?
  let rawTerms = search.trim().split(/[\t\n ]+/)
  let terms = []
  let tags = []
  while (rawTerms.length > 0) {    
    // try and find a vector for this phrase
    let rawTerm = rawTerms.shift()
    if (rawTerm.match(/^#([a-zA-Z0-9-_]+)$/)) {
      tags.push(rawTerm.slice(1))
    } else {
      let queryTerm = await vectorLibrary.lookup(rawTerm)
      if (!queryTerm) queryTerm = await vectorLibrary.lookup(rawTerm.toLowerCase()) // try lowercase?
      if (!queryTerm) queryTerm = rawTerm // fallback to hash based searches
      terms.push(queryTerm)
    }
  }
  
  // this stores the search results out of order, while we work on the quality signals
  let resultsStore = {}
  
  // search all of our sign libraries for results
  for (let query of terms) {
    for (let searchLibrary of signLibraries) {
      (await searchLibrary.lookup(query)).forEach(result => {
        if (tags.every((tag)=> result.entity.tags.includes(tag))) {
          let idx = `${result.library.name}:${result.id}`
          if (resultsStore[idx]) resultsStore[idx].distance += result.distance
          else resultsStore[idx] = result
        }
      })
    }
  }

  // sort our results by relevance
  searchResults = Object.values(resultsStore).sort((a,b)=> a.distance - b.distance)

  await setView('results')
}

async function setView(viewName, ...args) {
  activeView = document.body.className = viewName

  if (activeView == 'home') await renderHome(...args)
  else if (activeView == 'notice') await renderNotice(...args)
  else if (activeView == 'results') await renderResults(...args)
}

async function renderHome() {
  // nothing much to do here?
  //setView('notice', "Enter a search", 'enter-search')
  //s$('#search_box').val('') // erase the field
  $("#search_box").focus() // accessibility of this is bad?? MDN suggests so, but seems like google does it?
  $("#results").empty()
  $("#pagination").empty()
  document.title = originalTitle
  window.location.hash = ''
}

function renderNotice(text, signtip) {
  if (!signtip || signtip.toString().trim().length == 0)
    throw new Error(`Accessibility violation! Notice displayed "${text}" but no signtip supplied`)
  document.title = originalTitle
  $("#results").empty().append($('<div>').text(text).attr('data-signtip', signtip.toString()))
}

async function renderResults() {
  let displayResults = searchResults.slice(pageOffset, pageOffset + resultsShown)
  let resultsBox = $("#results")
  window.scrollTo(0,0)
  resultsBox.empty()
  $('#pagination').empty()

  window.location.hash = "#" + [lastQuery, pageOffset].map(x => encodeURIComponent(x)).join('/')

  for (let result of displayResults) {
    let template = $('<a class="result"></a>')
    let videoWidget = $('<div class="video_player" data-current="0" data-variations="1">')
    videoWidget.append('<button class="prev_vid" style="display: none" aria-label="Previous Variation Video">&lt;</button>')
    videoWidget.append('<button class="next_vid" style="display: none" aria-label="Next Variation Video">&gt;</button>')

    let video = $('<video class="video_thumb" muted preload autoplay loop playsinline></video>')
    video.attr('src', result.library.videoLink(result, 0))
    videoWidget.append(video)
    template.append(videoWidget)

    template.append('<div class="gloss_list"></div>')
    template.append('<div class="link"></div>')
    template.append('<div class="tags"></div>')
    template.append('<div class="confidence"><div class="subconfidence"></div></div>')
    template.append('<div class="mini_def"></div>')

    resultsBox.append(template)

    result.library.fetchDef(result)
    .then((def)=> {
      template.attr("href", def.link)
      template.find(".gloss_list").text(def.glossList.join(", "))
      template.find(".link").text(def.link)
      template.find(".tags").text(result.entity.tags.map((x)=> `#${x}`).join(' '))
      template.find(".mini_def").text(def.body || "")
      template.find(".video_player").attr('data-variations', def.variations)
      
      // move forward or backwards through variant list
      let setVariant = (adjust)=> {
        let current = parseInt(template.find(".video_player").attr('data-current'))
        let update = Math.min(Math.max(current + Math.round(adjust), 0), def.variations - 1) // constrain to sane values
        // store new position to attribute
        template.find(".video_player").attr('data-current', update)
        // update video sources
        template.find(".video_player video").remove()
        let videoWidget = template.find(".video_player")
        let video = $('<video class="video_thumb" muted preload autoplay loop playsinline></video>')
        video.attr('src', result.library.videoLink(result, update))
        videoWidget.append(video)
        
        template.find(".video_player button.prev_vid").css('display', update > 0 ? 'block' : 'none')
        template.find(".video_player button.next_vid").css('display', update < (def.variations - 1) ? 'block' : 'none')
      }

      setVariant(0)

      // hook up the buttons
      template.find(".video_player button.prev_vid").click((event)=> { event.preventDefault(); setVariant(-1) })
      template.find(".video_player button.next_vid").click((event)=> { event.preventDefault(); setVariant(+1) })
    })

    // delay before adding next result, helps load things in order, and makes a pretty animation
    await (new Promise((resolve, reject) => setTimeout(resolve, parseFloat(getStyleSetting('--fade-time-offset')) * 1000 )))
  }
  
  // update the pagination display
  let maxPages = 8
  let pages = Math.min(maxPages, searchResults.length / resultsShown) // coda for iPad is bad/
  for (let pageID = 1; pageID <= pages; pageID++) {
    let pageButton = $(`<button id="page-button-${pageID}" data-signtip="${pageID}" aria-label="Page ${pageID}">${pageID}</button>`) // coda is still bad/
    if (pageOffset / resultsShown == pageID - 1) pageButton.addClass('current-page') // STILL!/
    else pageButton.click((event)=> {
      pageOffset = (pageID - 1) * resultsShown
      setView('results')
    })
    $('#pagination').append(pageButton)
  }
}

setup()
