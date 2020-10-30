const html = require('nanohtml')
const URL = require('url').URL
const { decache, pathURL } = require('./view-utils')
const icon = require('./component-icon')
const PaginatorComponent = require('./component-paginator')

class DocumentTemplate {
  constructor ({ location, title, query, openGraph, lang, logoPath, navLinks, disable }) {
    this.location = location
    this.title = title
    this.query = query || ''
    this.lang = lang
    this.openGraph = openGraph
    this.navLinks = navLinks || [
      ['About', 'about.html'],
      ['Technology', 'technology.html'],
      ['Add Video', 'contribute.html'],
      ['News', new URL('https://blog.auslan.fyi/')]
    ]
    this.logoPath = logoPath
    this.disable = disable || {}
  }

  async setBody (bodyProvider) {
    await bodyProvider.load()
    this.body = bodyProvider
  }

  toHeadHTML () {
    const pieces = [
      html`<title>${this.title}</title>`,
      html`<meta charset="utf-8">`,
      html`<link rel=stylesheet href="${decache('style/default.css')}">`,
      ...this.body.getHeadTags(),
      html`<meta name=viewport content="width=device-width">`,
      html`<link rel=icon type="image/png" sizes="32x32" href="${pathURL('style/favicon-32x32.png')}">`
    ]

    // implement special orange halloween theme
    const today = new Date()
    if (today.getMonth() === 9 && today.getDate() === 31) {
      pieces.push(`<link rel=stylesheet href="${decache('style/halloween.css')}">`)
    }

    if (!this.disable.javascript) pieces.push(html`<script defer src="${decache('lib/bundle.js')}"></script>`)
    // allow page providers to override opengraph properties
    const openGraph = {
      ...this.openGraph,
      ...this.body.getOpenGraph()
    }

    Object.entries(openGraph).map(([key, value]) =>
      pieces.push(html`<meta property="og:${key}" content="${value}">`)
    )
    return html`<head>${pieces}</head>`
  }

  toBodyHTML () {
    const paginator = new PaginatorComponent({
      getLabel: (n) => {
        if (n >= 0 && n < 9) {
          return icon(`${n + 1}`)
        } else {
          return `${n + 1}`
        }
      },
      ...this.body.getPaginatorState()
    })

    const pieces = []

    if (!this.disable.header) {
      pieces.push(html`
      <a href="${pathURL('/#')}"><img id="header" alt="Home Button" src="${decache(this.logoPath)}"></a>
      <form id="search-form" role="search" autocomplete="off" action="${pathURL('search')}" method="GET">
        ${icon('search')}
        <input id="search-box" autocomplete="off" autocapitalize="none" aria-label="Enter search query here." name="query" value="${this.query}">
      </form>
      <nav id="nav-links">
        ${this.navLinks.map(([title, path]) =>
          html`<a href="${typeof path === 'string' ? pathURL(path) : path}">${title}</a>`
        )}
      </nav>`)
    }

    if (!this.disable.body) pieces.push(this.body.toHTML())
    if (!this.disable.pagination) pieces.push(paginator.toHTML())

    if (!this.disable.javascript) {
      pieces.push(html`<script>
        // fight the evil fbclid and gclid thingies
        if (window.location.search.includes('clid=')) window.location.search = ''
        // detect browsers that do not support modern javascript, and redirect them to a browser upgrade page
        try {
          if (eval("(async (x)=> true)()").constructor != Promise) {
            throw new Error("async function doesn't return Promise")
          }
        } catch(e) {
          alert("Your browser is too out of date to support this webpage. If you would like to use this website, please update your browser, or install a browser like Firefox, which supports modern web standards. Error: " + e)
        }
        // check browser for API support, mostly to detect hecking Microsoft Edge (pre-chromium)
        if (!window.TextDecoder || !window.crypto || !window.crypto.subtle || !window.crypto.subtle.digest) {
          if (/Edge/.test(navigator.userAgent)) {
            alert('This website requires a more up to date browser app. Please use Windows Update to update your copy of Edge and try again later.')
          } else {
            alert('Your web browser does not seem to support modern web standards. Please update it and try again, or install and use Safari, Edge, Firefox, Opera, or Chrome to access this website')
          }
        }
      </script>`)
    }

    if (!this.disable.javascript && !this.disable.analytics) {
      pieces.push(html`<script>
      // Fathom - simple website analytics - https://github.com/usefathom/fathom
      (function(f, a, t, h, o, m){
        a[h]=a[h]||function(){
          (a[h].q=a[h].q||[]).push(arguments)
        };
        o=f.createElement('script'),
        m=f.getElementsByTagName('script')[0];
        o.async=1; o.src=t; o.id='fathom-script';
        m.parentNode.insertBefore(o,m)
      })(document, window, '//phx-analytics.glitch.me/tracker.js', 'fathom');
      fathom('set', 'siteId', 'WRWLH');
      fathom('trackPageview');
      </script>`)
    }

    const attributes = {
      class: this.body.getPageType(),
      ...Object.fromEntries(Object.entries(this.body.getData()).map(([k, v]) => [`data-${k}`, v]))
    }

    return html`<body ${attributes}>
      ${pieces}
    </body>`
  }

  toHTML () {
    return html`<!DOCTYPE html>
    <html lang="${this.lang}">
      ${this.toHeadHTML()}
      ${this.toBodyHTML()}
    </html>`
  }
}

module.exports = DocumentTemplate
