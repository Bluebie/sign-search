const fs = require('fs')
const path = require('path')
const util = require('util')
const gzip = require('zlib').gzipSync
const cbor = require('borc')
const crypto = require('crypto')
const beautify = require('js-beautify')
const pmHTML = require('pigeonmark-html')
const pmUtils = require('pigeonmark-utils')
const pmSelect = require('pigeonmark-select')
const signSearchConfig = require('../package.json').signSearch
const spidersConfig = require('./spiders/configs.json')
const webpack = require('webpack')

require('svelte/register')({ })

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

  // process appends
  if (appends.head) {
    pmSelect.selectOne(doc, 'html > head').push(...appends.head.flatMap(x => ['  ', x, '\n']))
  }
  if (appends.body) {
    pmSelect.selectOne(doc, 'html > body').push(...appends.body.flatMap(x => ['  ', x, '\n']))
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
async function writeHTML (filename, sveltePath, props = {}) {
  const Component = require(`../ui/${sveltePath}`).default
  const rendered = Component.render(props, { hydratable: true })

  // build initialisation code
  const jsInitPath = `../ui/.${sveltePath}-init.js`
  const jsOutputPath = `${filename}-bundle.js`
  fs.writeFileSync(jsInitPath, [
    `import Component from ${JSON.stringify(`./${sveltePath}`)}`,
    `const props = ${JSON.stringify(props, null, 2)}`,
    'const options = { target: document.body, props, hydrate: true }',
    'const component = new Component(options)',
    'window.app = component'
  ].join('\n'))
  const packStats = await util.promisify(webpack)({
    mode: 'production',
    entry: jsInitPath,
    output: { filename: jsOutputPath, path: path.dirname(require.resolve('../package.json')) },
    resolve: {
      // see below for an explanation
      alias: { svelte: path.dirname(require.resolve('svelte/package.json')) },
      extensions: ['.mjs', '.js', '.svelte'],
      mainFields: ['svelte', 'browser', 'module', 'main']
    },
    module: {
      rules: [
        {
          test: /\.(html|svelte)$/,
          use: {
            loader: 'svelte-loader',
            options: {
              // suppress inclusion of css inside js bundle
              compilerOptions: { css: false }
            }
          }
        },
        // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
        { test: /node_modules\/svelte\/.*\.mjs$/, resolve: { fullySpecified: false } }
      ]
    },
    devtool: 'source-map'
  })

  console.log(packStats.toString({ colors: true }))
  const js = fs.readFileSync(jsOutputPath).toString('utf-8')
  const jsSourceMap = fs.readFileSync(jsOutputPath + '.map').toString('utf-8')

  // apply all the concurrent stuff we can do
  const cssDecache = selectiveWrite(`${filename}-bundle.css`, beautify.css(rendered.css.code))
  const jsDecache = selectiveWrite(`${filename}-bundle.js`, js)
  selectiveWrite(`${filename}-bundle.js.map`, jsSourceMap)
  fs.unlinkSync(jsInitPath)
  fs.unlinkSync(jsOutputPath)
  fs.unlinkSync(jsOutputPath + '.map')

  const page = postProcess(toHTML(rendered), {
    head: [
      ['link', { rel: 'stylesheet', href: `${filename}-bundle.css?decache=${cssDecache}` }],
      ['script', { defer: '', src: `${filename}-bundle.js?decache=${jsDecache}` }]
    ]
  })

  selectiveWrite(`${filename}.html`, page)
}

async function defaultRun () {
  const updatesLog = cbor.decodeAll(fs.readFileSync('../datasets/update-log.cbor'))
  await writeHTML('index', 'index.svelte', {
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
  })

  await writeHTML('random', 'random.svelte', {
    // props
  })
}

defaultRun()
