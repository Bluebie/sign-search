const fs = require('fs-extra')
const appRootPath = require('app-root-path')
const beautify = require('js-beautify').html
const util = require('util')
const zlib = require('zlib')
const gzip = util.promisify(zlib.gzip)

const DocumentTemplate = appRootPath.require('/lib/views/html-document')
const FeedProvider = appRootPath.require('/lib/views/provider-feed')
const StaticPageProvider = appRootPath.require('/lib/views/provider-static-page')

const defaultConfig = appRootPath.require('/package.json').signSearch

const beautifyOptions = {
  indent_size: 2,
  max_preserve_newlines: 2
}

async function buildPage(pageProvider) {
  let template = new DocumentTemplate({...defaultConfig, ...pageProvider.getConfig()})
  await template.setBody(pageProvider)
  return beautify(template.toHTML(), beautifyOptions)
}

// writes a new file if the contents of the file changed
async function writeFileIfChanged(path, data) {
  if (!Buffer.isBuffer(data)) data = Buffer.from(data)
  if (await fs.pathExists(path)) {
    let oldData = await fs.readFile(path)
    if (oldData.equals(data)) return // no change, nevermind
  }
  
  await Promise.all([
    fs.writeFile(path, data),
    fs.writeFile(`${path}.gz`, await gzip(data, { level: 9 }))
  ])
}

async function build() {
  let feedProvider = new FeedProvider

  await feedProvider.load()
  let feeds = feedProvider.toFeeds()
  // write feeds
  let feedWriteTasks = Object.entries(feeds).map(([filename, contents]) => 
    writeFileIfChanged(appRootPath.resolve(`/feeds/${filename}`), contents)
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
    await writeFileIfChanged(pagePath, pageString)
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