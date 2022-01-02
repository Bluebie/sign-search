const fs = require('fs-extra')
const util = require('util')
const gzip = util.promisify(require('zlib').gzip)
const cbor = require('borc')
const beautify = require('js-beautify').html
const pmHTML = require('pigeonmark-html')
const pmUtils = require('pigeonmark-utils')
const pmSelect = require('pigeonmark-select')
const signSearchConfig = require('../package.json').signSearch
const spidersConfig = require('./spiders/configs.json')

require('svelte/register')({
  // cssHash: ()
})
const IndexPage = require('../ui/index.svelte').default


// wrap svelte output in to a html document
function toHTML (svelteOutput) {
  return [
    '<!DOCTYPE html>',
    '<html><head>',
    svelteOutput.head,
    '<style>',
    svelteOutput.css.code,
    '</style>',
    '</head><body>',
    svelteOutput.html,
    '</body></html>'
  ].join('\n')
}

// apply post processing to html output to clean it up a bit and add cache invalidation for static resources
async function postProcess (html) {
  const beautiful = beautify(html, { indent_size: 2 })
  const doc = pmHTML.decode(beautiful)

  const urlTargets = {
    'link[rel=stylesheet][href]': 'href',
    'img[src]': 'src',
    'source[src]': 'src',
    'script[src]': 'src',
    'svg use[href]': 'href'
  }
  // add cache invalidation query strings to links to static resources
  for (const [selector, attr] of Object.entries(urlTargets)) {
    for (const element of pmSelect.selectAll(doc, selector)) {
      const url = new URL(pmUtils.get.attribute(element, attr), signSearchConfig.location)
      if (url.toString().startsWith(signSearchConfig.location)) {
        try {
          const stats = await fs.stat('..' + url.pathname)
          url.searchParams.set('decache', Math.round(stats.mtimeMs).toString(36))
          let rebuilt = url.toString().slice(signSearchConfig.location.length)
          if (!rebuilt.startsWith('/')) rebuilt = `/${rebuilt}`
          pmUtils.set.attribute(element, attr, rebuilt)
        } catch (err) {
          // skip it
        }
      }
    }
  }

  return pmHTML.encode(doc)
}

// atomically replace the html files with no downtime, including building a gzipped version
async function writeHTML (filename, render) {
  const page = await postProcess(toHTML(render))

  const tempFilename = `${filename}.rewriting-${Math.round(Math.random() * 0xFFFFFF).toString(36)}.tmp`

  // check if file contents changed, and bail if nothing changed
  const oldContents = (await fs.readFile(filename)).toString('utf-8')
  if (page === oldContents) return

  await Promise.all([
    fs.writeFile(tempFilename, page),
    fs.writeFile(`${tempFilename}.gz`, await gzip(page))
  ])

  // remember, rename replaces existing files, atomically, with no downtime, on unixes and windows
  await Promise.all([
    fs.rename(tempFilename, filename),
    fs.rename(`${tempFilename}.gz`, `${filename}.gz`)
  ])
}

async function defaultRun () {
  const updatesLog = cbor.decodeAll(await fs.readFile('../datasets/update-log.cbor'))
  await writeHTML('../index-2.html', IndexPage.render({
    query: 'Example',
    feed: updatesLog.filter(entry => entry.available).slice(-signSearchConfig.discoveryFeed.length).map(entry => {
      const spider = spidersConfig[entry.provider] || {}
      return {
        timestamp: entry.timestamp,
        authorName: spider.displayName || entry.provider,
        authorLink: spider.link || entry.providerLink,
        verb: entry.verb || spider.discoveryVerb,
        link: entry.link,
        title: entry.title || entry.words.join(', ')
      }
    })
  }))
}

defaultRun()
