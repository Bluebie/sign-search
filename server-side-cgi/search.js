#!/usr/bin/env node
// sometimes these things hang? idk why, but uh, kill yourself please? thx
setTimeout(() => process.exit(), 10000) // best bugfix ever. someone give me an award

const URL = require('url').URL
const process = require('process')
const arp = require('app-root-path')
const fs = require('fs-extra')
const crypto = require('crypto')
const util = require('util')

const HTMLDocument = arp.require('lib/views/html-document')
const ErrorPage = arp.require('lib/views/provider-error-page')
const ResultsPage = arp.require('lib/views/provider-search-results')
const SearchEngine = arp.require('lib/search-engine/engine')

const signSearchConfig = arp.require('package.json').signSearch

// local node digest function
async function digest (algo, data) {
  const hash = crypto.createHash(algo)
  hash.update(data)
  return new Uint8Array(hash.digest())
}

// handle an incomming cgi request, making a similar interface to node's http server
async function handleCGI (handler) {
  const url = new URL(process.env.REQUEST_URI || `${process.env.SCRIPT_NAME}?${process.env.QUERY_STRING}`, `http://${process.env.HTTP_HOST || process.env.SERVER_NAME}/`)
  url.protocol = process.env.HTTPS ? 'https' : 'http'
  const request = {
    method: process.env.REQUEST_METHOD,
    headers: {},
    url
  }

  Object.entries(process.env).forEach(([key, value]) => {
    if (key.startsWith('HTTP_')) {
      request.headers[key.slice(5).toLowerCase().replace('_', '-')] = value
    }
  })

  const respond = async (status, headers, body) => {
    if (!Buffer.isBuffer(body)) body = Buffer.from(body, 'utf-8')
    const finalHeaders = {
      Status: status,
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/plain; charset=utf-8',
      ...headers
    }

    const write = util.promisify(process.stdout.write).bind(process.stdout)
    await write(Object.entries(finalHeaders).map(([key, value]) => {
      return `${key}: ${value}\n`
    }).join('') + '\n')
    await write(body)
  }

  await handler(request, respond)
}

// run the cgi-bin script
async function handleRequest (request, respond) {
  const document = new HTMLDocument({
    ...signSearchConfig,
    disable: { javascript: true, analytics: true }
  })

  try {
    // initialise search engine
    const engine = new SearchEngine({
      vectorLibraryPath: arp.resolve('datasets/cc-en-300-8bit'),
      searchLibraryPath: arp.resolve('datasets/search-index'),
      libraryConfig: {
        fs, digest, webURL: 'datasets/search-index'
      }
    })
    // load any data needed to make it queryable
    await engine.load()

    // grab content from query string that we need
    const query = document.query = request.url.searchParams.get('query') || ''
    const offset = parseInt(request.url.searchParams.get('offset')) || 0

    if (query.trim() === '') throw new Error('Please enter a search query')

    // set document query string to fill search box
    const results = await engine.query(query)

    if (results.length === 0) throw new Error('No results found')

    await document.setBody(new ResultsPage({ results, offset, query }))
  } catch (err) {
    await document.setBody(new ErrorPage(err.message))
  }

  await respond(200, {
    'Content-Type': 'text/html; charset=utf-8'
  }, document.toHTML().toString())
}

handleCGI(handleRequest)
