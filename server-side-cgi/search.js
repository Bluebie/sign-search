#!/usr/bin/env node
const URL = require('url').URL
//const cgi = require('node-cgi')
const process = require('process')
const arp = require('app-root-path')
const fs = require('fs-extra')
const crypto = require('crypto')

const HTMLDocument = arp.require('lib/views/html-document')
const ErrorPage = arp.require('lib/views/provider-error-page')
const ResultsPage = arp.require('lib/views/provider-search-results')
const SearchEngine = arp.require('lib/search-engine/engine')

const signSearchConfig = arp.require('package.json').signSearch

// local node digest function
async function digest(algo, data) {
  let hash = crypto.createHash(algo)
  hash.update(data)
  return new Uint8Array(hash.digest())
}

// run the cgi-bin script
async function run() {
  let document = new HTMLDocument({
    ...signSearchConfig,
    disable: { javascript: true, analytics: true }
  })

  try {
    let engine = new SearchEngine({
      vectorLibraryPath: arp.resolve('datasets/cc-en-300-8bit'),
      searchLibraryPath: arp.resolve('datasets/search-index'),
      libraryConfig: {
        fs, digest, webURL: 'datasets/search-index'
      }
    })
    await engine.load()
    
    // decode query string
    let { query, offset } = Object.fromEntries(
      process.env.QUERY_STRING.split('&').map(pair => pair.split('=').map(x => decodeURIComponent(x.replace(/\+/g, ' '))))
    )
    // set document query string to fill search box
    document.query = query
    let results = await engine.query(query)
    
    if (results.length == 0) throw new Error("No results found")
    
    await document.setBody(new ResultsPage({ results, offset: parseInt(offset) || 0, query }))
  } catch (err) {
    await document.setBody(new ErrorPage(err.message))
  }
  
  let body = document.toHTML().toString()
  console.log(`Content-Type: text/html; charset=utf-8`)
  //console.log(`Content-Length: ${Buffer.byteLength(body)}`)
  console.log(``)
  console.log(body)
}

run()