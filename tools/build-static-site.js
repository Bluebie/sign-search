const fs = require('fs-extra')
const beautify = require('js-beautify').html
const util = require('util')
const zlib = require('zlib')
const gzip = util.promisify(zlib.gzip)
const { SitemapStream, streamToPromise } = require('sitemap')

const DocumentTemplate = require('../lib/views/html-document')
const FeedProvider = require('../lib/views/provider-feed')
const StaticPageProvider = require('../lib/views/provider-static-page')

const defaultConfig = require('../package.json').signSearch

const beautifyOptions = {
  indent_size: 2,
  max_preserve_newlines: 2
}

async function buildPage (pageProvider) {
  const template = new DocumentTemplate({ ...defaultConfig, ...pageProvider.getConfig() })
  await template.setBody(pageProvider)
  return beautify(template.toHTML(), beautifyOptions)
}

// writes a new file if the contents of the file changed
async function writeFileIfChanged (path, data) {
  if (!Buffer.isBuffer(data)) data = Buffer.from(data)
  if (await fs.pathExists(path)) {
    const oldData = await fs.readFile(path)
    if (oldData.equals(data)) return // no change, nevermind
  }

  await Promise.all([
    fs.writeFile(path, data),
    fs.writeFile(`${path}.gz`, await gzip(data, { level: 9 }))
  ])
}

async function build () {
  const feedProvider = new FeedProvider()

  await feedProvider.load()
  const feeds = feedProvider.toFeeds()
  // write feeds
  await fs.ensureDir('../')
  const feedWriteTasks = Object.entries(feeds).map(([filename, contents]) =>
    writeFileIfChanged(require.resolve(`../feeds/${filename}`), contents)
  )

  // await all feeds to write
  await Promise.all(feedWriteTasks)

  // write static-ish pages
  const pageProviders = {
    index: feedProvider,
    about: new StaticPageProvider('about'),
    technology: new StaticPageProvider('technology'),
    contribute: new StaticPageProvider('contribute'),
    random: new StaticPageProvider('random'),
    'no-javascript': new StaticPageProvider('no-javascript')
  }

  // write pages, and build a sitemap
  const sitemap = new SitemapStream({ hostname: defaultConfig.location })
  const staticPageTasks = Object.entries(pageProviders).map(async ([pageName, provider]) => {
    const pagePath = require.resolve(`../${pageName}.html`)
    const pageString = await buildPage(provider)
    // add to sitemap
    sitemap.write(pageName === 'index' ? '/' : `/${pageName}.html`)
    // rewrite file if content changed, including compressed version
    await writeFileIfChanged(pagePath, pageString)
  })

  // await all pages to finish writing
  await Promise.all(staticPageTasks)

  // finalise the sitemap
  sitemap.end()
  await writeFileIfChanged(require.resolve('../sitemap.xml'), await streamToPromise(sitemap))

  console.log('Build complete')
}

build()
  .catch(err => {
    throw err
  })
