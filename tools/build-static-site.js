const fs = require('fs-extra')
const util = require('util')
const cleanHtml = require('clean-html')
const appRootPath = require('app-root-path')

const DocumentTemplate = appRootPath.require('/lib/views/html-document')
const FeedProvider = appRootPath.require('/lib/views/feed-provider')
const StaticPageProvider = appRootPath.require('/lib/views/static-page-provider')

const defaultConfig = appRootPath.require('/package.json').signSearch

const cleanHTMLConfig = {
  "add-break-around-tags": ['form', 'main']
}

async function buildPage(pageProvider) {
  let template = new DocumentTemplate({...defaultConfig, ...pageProvider.getConfig()})
  await template.setBody(pageProvider)
  return template.toHTML()
  return await util.promisify(cleanHtml.clean)(template.toHTML(), cleanHTMLConfig)
}

async function build() {
  let feedProvider = new FeedProvider

  await feedProvider.load()
  let feeds = feedProvider.toFeeds()
  // write feeds
  let feedWriteTasks = Object.entries(feeds).map(([filename, contents]) => 
    fs.writeFile(appRootPath.resolve(`/feeds/${filename}`), contents)
  )

  // write static-ish pages
  let pageProviders = {
    index: feedProvider,
    about: new StaticPageProvider('about'),
    technology: new StaticPageProvider('technology'),
    contribute: new StaticPageProvider('contribute'),
    "no-javascript": new StaticPageProvider('no-javascript')
  }

  // write pages
  let staticPageTasks = Object.entries(pageProviders).map(async ([pageName, provider]) => {
    let pagePath = appRootPath.resolve(`/${pageName}.html`)
    let pageString = await buildPage(provider)
    await fs.writeFile(pagePath, pageString)
  })

  // await all files to finish writing
  await Promise.all([
    ...feedWriteTasks,
    ...staticPageTasks
  ])

  console.log('Build complete')
}

build()
.catch(err => {
  throw err
})