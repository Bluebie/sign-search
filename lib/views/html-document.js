const html = require('nanohtml')
const raw = require('nanohtml/raw')
const URL = require('url').URL
const fsutil = require('../sign-search-utils')
const { decache, pathURL, fullURL } = require('./view-utils')
const PaginatorComponent = require('./component-paginator')

class DocumentTemplate {
  constructor({ location, title, openGraph, lang, logoPath, navLinks }) {
    this.location = location
    this.title = title
    this.lang = lang
    this.openGraph = openGraph
    this.navLinks = navLinks || [
      ["About", "about.html"],
      ["Technology", "technology.html"],
      ["Add Video", "contribute.html"],
      ["News", new URL("https://blog.auslan.fyi/")]
    ]
    this.logoPath = logoPath
  }

  async setBody(bodyProvider) {
    await bodyProvider.load()
    this.body = bodyProvider
  }

  toHeadHTML() {
    return html`<head>
      <title>${this.title}</title>
      <meta charset="utf-8">
      <link rel=stylesheet href="${decache("style/default.css")}">
      <script defer src="${decache("lib/bundle.js")}"></script>
      <link rel=alternate title="Recently Added (JSON)" type="application/json" href="${fullURL("feeds/discovery.json")}">
      <link rel=alternate title="Recently Added (Atom)" type="application/atom+xml" href="${fullURL("feeds/discovery.atom")}">
      <meta name=viewport content="width=device-width">
      <link rel=icon type="image/png" sizes="32x32" href="${pathURL("style/favicon-32x32.png")}">
      ${Object.entries(this.openGraph).map(([key, value])=>
        html`<meta property="og:${key}" content="${value}">`
      )}
    </head>`
  }

  toBodyHTML() {
    let paginator = new PaginatorComponent(this.body.getPaginatorState())

    return html`<body class="${this.body.getPageType()}" ${Object.entries(this.body.getData()).map(([k,v])=> html` data-${k}="${v}"`)}>
      <a href="${pathURL('/#')}"><img id="header" role="img" alt="Home Button" src="${decache(this.logoPath)}"></a>
      <form id="search-form" role="search" autocomplete="off" action="${pathURL("no-javascript.html")}">
        <span class="icon-search input-icon" aria-hidden="true"></span>
        <input id="search-box" autocomplete="off" autocapitalize="none" aria-label="Enter search query here.">
      </form>
      <nav id="nav-links">
        ${this.navLinks.map(([title, path])=>
          html`<a href="${typeof(path) == 'string' ? pathURL(path) : path}">${title}</a>\n`  
        )}
      </nav>
      
      ${this.body.toHTML()}

      ${paginator.toHTML()}
  
      <script>
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
      </script>
  
      <script>
        // Fathom - simple website analytics - https://github.com/usefathom/fathom
        (function(f, a, t, h, o, m){
          a[h]=a[h]||function(){
            (a[h].q=a[h].q||[]).push(arguments)
          };
          o=f.createElement('script'),
          m=f.getElementsByTagName('script')[0];
          o.async=1; o.src=t; o.id='fathom-script';
          m.parentNode.insertBefore(o,m)
        })(document, window, '//analytics.auslan.fyi/tracker.js', 'fathom');
        fathom('set', 'siteId', 'DKXXG');
        fathom('trackPageview');
      </script>
    </body>`
  }

  toHTML() {
    return html`<!DOCTYPE html>
    <html lang="${this.lang}">
      ${this.toHeadHTML()}
      ${this.toBodyHTML()}
    </html>`
  }
}

module.exports = DocumentTemplate