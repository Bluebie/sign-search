const fs = require('fs-extra')
// const util = require('util')
// const gzip = util.promisify(require('zlib').gzip)
// const process = require('process')
const beautify = require('js-beautify').html
const pmHTML = require('pigeonmark-html')
const pmUtils = require('pigeonmark-utils')
const pmSelect = require('pigeonmark-select')

require('svelte/register')
const IndexPage = require('../ui/index.svelte').default

const signSearchConfig = require('../package.json').signSearch

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

async function defaultRun () {
  const idx = IndexPage.render({
    query: 'Example',
    feed: [
      {
        timestamp: Date.now(),
        authorName: 'System',
        authorLink: 'https://find.auslan.fyi/',
        verb: 'tested',
        link: 'https://dev.auslan.fyi/',
        title: 'view building'
      }
    ]
  })

  const page = await postProcess(toHTML(idx))
  // console.log(page)

  await fs.writeFile('../index-2.html', page)
}

defaultRun()
