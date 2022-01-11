import { readdir, readFile, writeFile, rename } from 'fs/promises'
import { gzipSync as gzip } from 'zlib'
import crypto from 'crypto'
import beautify from 'js-beautify'
import pmHTML from 'pigeonmark-html'
import pmUtils from 'pigeonmark-utils'
import pmSelect from 'pigeonmark-select'

import * as fetchAPI from 'node-fetch'

globalThis.fetch = fetchAPI.default
globalThis.Request = fetchAPI.Request
globalThis.Response = fetchAPI.Response
globalThis.Headers = fetchAPI.Headers

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
async function postProcess (html, appends = {}) {
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
      const url = new URL(pmUtils.get.attribute(element, attr), 'https://example.org')
      if (url.toString().startsWith('https://example.org')) {
        try {
          const data = await readFile('..' + url.pathname)
          url.searchParams.set('decache', checksum(data))
          let rebuilt = url.toString().slice('https://example.org'.length)
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
async function selectiveWrite (filename, data) {
  // check if file contents changed, and bail if nothing changed
  let oldContents
  try {
    oldContents = (await readFile(filename)).toString('utf-8')
  } catch (err) {}

  if (data.toString('utf-8') !== oldContents) {
    const tempFilename = `${filename}.rewriting-${Math.round(Math.random() * 0xFFFFFF).toString(36)}.tmp`
    await Promise.all([
      writeFile(`../${tempFilename}`, data),
      writeFile(`../${tempFilename}.gz`, gzip(data))
    ])

    await Promise.all([
      rename(`../${tempFilename}`, `../${filename}`),
      rename(`../${tempFilename}.gz`, `../${filename}.gz`)
    ])
  }

  return checksum(data)
}

// build static rendered html
async function writeHTML (filename, config = false) {
  const props = config ? await config.getProps() : {}
  const isLive = config ? config.isLive : true

  console.log(filename, props)

  const { default: Component } = await import(`../ui/build/ssr/${filename}.mjs`)
  const rendered = Component.render(props, { hydratable: true })

  const head = [
    ['link', { rel: 'stylesheet', href: 'ui/theme.css' }],
    ['link', { rel: 'stylesheet', href: `ui/build/${filename}.css` }]
  ]

  if (isLive) {
    const initializerJS = [
      `import Component from ${JSON.stringify(`./ui/build/${filename}.mjs?${checksum(await readFile(`../ui/build/${filename}.mjs`))}`)}`,
      `const props = ${JSON.stringify(props)}`,
      'const options = { target: document.body, props, hydrate: true }',
      'const component = new Component(options)',
      'window.app = component'
    ].map(x => `    ${x}`).join('\n')

    head.push(
      ['#comment', ' Rehydrate Svelte Components: '],
      ['script', { type: 'module' }, `\n${initializerJS}\n  `]
    )
  }

  const page = await postProcess(toHTML(rendered), { head })

  await selectiveWrite(`${filename}.html`, page)
}

async function defaultRun () {
  for (const file of await readdir('../ui')) {
    if (!file.endsWith('.svelte')) continue

    console.log(`building ${file}`)
    let module
    try {
      module = await import(`../ui/ssr-config/${file.replace('.svelte', '.mjs')}`)
    } catch (error) {
      // ignore file missing errors, it's fine
      if (error.code !== 'ERR_MODULE_NOT_FOUND') {
        throw error
      }
    }

    await writeHTML(file.replace(/\.svelte$/, ''), module)
  }

  console.log('finished')
}

defaultRun()
