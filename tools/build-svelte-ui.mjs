import fs from 'fs-extra'
import { gzipSync as gzip } from 'zlib'
import cbor from 'borc'
import crypto from 'crypto'
// import module from 'module'

import beautify from 'js-beautify'
import pmHTML from 'pigeonmark-html'
import pmUtils from 'pigeonmark-utils'
import pmSelect from 'pigeonmark-select'

// const require = module.createRequire(import.meta.url)
// require('svelte/register')

const signSearchConfig = JSON.parse(fs.readFileSync('../package.json')).signSearch
const spidersConfig = JSON.parse(fs.readFileSync('./spiders/configs.json'))

function checksum (data) {
  const cypher = crypto.createHash('md5')
  cypher.update(data)
  return cypher.digest().readUInt32BE(0).toString(36)
}

// wrap svelte output in to a html document
function toHTML (svelteOutput) {
  return [
    '<!DOCTYPE html>',
    '<html><head>',
    svelteOutput.head,
    '</head><body>',
    svelteOutput.html,
    '</body></html>'
  ].join('\n')
}

// apply post processing to html output to clean it up a bit and add cache invalidation for static resources
function postProcess (html, appends = {}) {
  const beautiful = beautify.html(html, { indent_size: 2 })
  const doc = pmHTML.decode(beautiful)

  // process appends
  if (appends.head) {
    pmSelect.selectOne(doc, 'html > head').push(...appends.head.flatMap(x => ['  ', x, '\n']))
  }
  if (appends.body) {
    pmSelect.selectOne(doc, 'html > body').push(...appends.body.flatMap(x => ['  ', x, '\n']))
  }

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
          const data = fs.readFileSync('..' + url.pathname)
          url.searchParams.set('decache', checksum(data))
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

// write a file, if the contents changed, and return the file's mtime in base36 for decache
function selectiveWrite (filename, data) {
  // check if file contents changed, and bail if nothing changed
  let oldContents
  try {
    oldContents = fs.readFileSync(filename).toString('utf-8')
  } catch (err) {}

  if (data.toString('utf-8') !== oldContents) {
    const tempFilename = `${filename}.rewriting-${Math.round(Math.random() * 0xFFFFFF).toString(36)}.tmp`
    fs.writeFileSync(`../${tempFilename}`, data)
    fs.writeFileSync(`../${tempFilename}.gz`, gzip(data))

    fs.renameSync(`../${tempFilename}`, `../${filename}`)
    fs.renameSync(`../${tempFilename}.gz`, `../${filename}.gz`)
  }

  return checksum(data)
}

// atomically replace the html files with no downtime, including building a gzipped version
async function writeHTML (filename, props = {}) {
  await fs.ensureDir('../ui/build')

  const { default: Component } = await import(`../ui/build/ssr/${filename}.mjs`)
  const rendered = Component.render(props, { hydratable: true })

  const jsDecache = checksum(fs.readFileSync(`../ui/build/${filename}.mjs`))

  const initializerJS = [
    `import Component from ${JSON.stringify(`./ui/build/${filename}.mjs?${jsDecache}`)}`,
    `const props = ${JSON.stringify(props)}`,
    'const options = { target: document.body, props, hydrate: true }',
    'const component = new Component(options)',
    'window.app = component'
  ].map(x => `    ${x}`).join('\n')

  const page = postProcess(toHTML(rendered), {
    head: [
      ['link', { rel: 'stylesheet', href: 'ui/theme.css' }],
      ['link', { rel: 'stylesheet', href: `ui/build/${filename}.css` }],
      ['#comment', ' Rehydrate Svelte Components: '],
      ['script', { type: 'module' }, `\n${initializerJS}\n  `]
    ]
  })

  selectiveWrite(`${filename}.html`, page)
}

async function defaultRun () {
  const updatesLog = cbor.decodeAll(fs.readFileSync('../datasets/update-log.cbor'))
  await writeHTML('index', {
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
  })

  await writeHTML('random', {
    // props
  })
}

defaultRun()
