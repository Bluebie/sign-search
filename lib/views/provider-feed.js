// Feed Provider generates a feed of recently added content, to add to the homepage, or to the discovery feeds
const html = require('nanohtml')
const fs = require('fs-extra')
const cbor = require('borc')

const Feed = require('feed').Feed
const dateFNS = require('date-fns')
const pmXML = require('pigeonmark-xml')
const pmUtils = require('pigeonmark-utils')
const pmSelect = require('pigeonmark-select')
const got = require('got')

const appRootPath = require('app-root-path')
const signSearchConfig = appRootPath.require('/package.json').signSearch
const spiderConfigs = appRootPath.require('/tools/spiders/configs.json')
const base = require('./provider-base')
const { fullURL } = require('./view-utils')
const icon = require('./component-icon')
const maxTitleLength = 40

class FeedProvider extends base {
  async load () {
    if (this.visibleUpdates) return
    const updates = cbor.decodeAll(await fs.readFile(appRootPath.resolve('/datasets/update-log.cbor')))
    this.visibleUpdates = updates

    try {
      var blogfeedResponse = await got(signSearchConfig.newsRSS)
    } catch (err) {
      console.error(`Failed to fetch or parse rss feed: ${err}`)
      console.log("RSS feed wasn't included in discovery feed or homepage due to error, but build continues")
    }

    const blogfeedDoc = pmXML.decode(blogfeedResponse.body)

    const provider = pmUtils.get.text(pmSelect.selectOne(blogfeedDoc, 'channel > title'))
    const providerLink = pmUtils.get.text(pmSelect.selectOne(blogfeedDoc, 'channel > link'))

    pmSelect.selectAll(blogfeedDoc, 'item').forEach(item => {
      let title = pmUtils.get.text(pmSelect.selectOne(item, 'title'))
      const link = pmUtils.get.text(pmSelect.selectOne(item, 'link'))
      const body = pmUtils.get.text(pmSelect.selectOne(item, 'description'))
      const verb = 'posted'
      const timestamp = Date.parse(pmUtils.get.text(pmSelect.selectOne(item, 'pubDate')))

      if (title.length > maxTitleLength) title = `${title.slice(0, maxTitleLength - 1)}…`

      this.visibleUpdates.push({ provider, providerLink, link, timestamp, verb, body, words: [title], available: true })
    })

    this.visibleUpdates = this.visibleUpdates.filter(x => x.available)
    this.visibleUpdates = this.visibleUpdates.sort((a, b) => a.timestamp - b.timestamp)
    this.visibleUpdates = this.visibleUpdates.slice(-(signSearchConfig.discoveryFeed.length))
  }

  getPageType () {
    return 'home'
  }

  // add's data attributes telling the front end UI to hook up search box and stuff
  // TODO: get rid of this, lets just always have the search box
  getData () {
    return { hook: 'true' }
  }

  getHeadTags () {
    return [
      html`<link rel=alternate title="Recently Added (JSON)" type="application/json" href="${fullURL('feeds/discovery.json')}">`,
      html`<link rel=alternate title="Recently Added (Atom)" type="application/atom+xml" href="${fullURL('feeds/discovery.atom')}">`,
      html`<link rel=alternate title="Recently Added (RSS)" type="application/rss+xml" href="${fullURL('feeds/discovery.rss')}">`
    ]
  }

  toFeeds () {
    const feed = new Feed({
      updated: new Date(Math.max(...this.visibleUpdates.map(entry => entry.timestamp))),
      ...signSearchConfig.discoveryFeed
    })

    this.visibleUpdates.forEach(entry => {
      const spiderConfig = {
        displayName: entry.provider,
        link: entry.providerLink,
        ...(spiderConfigs[entry.provider] || {})
      }
      feed.addItem({
        id: `${entry.provider}:${entry.id}`,
        title: `${spiderConfig.displayName} ${entry.verb} ${[...entry.words].flat(2).join(', ').trim()}`,
        link: entry.link,
        date: new Date(entry.timestamp),
        description: `${entry.body}\n...`,
        author: { name: spiderConfig.displayName, link: spiderConfig.link }
      })
    })

    return {
      'discovery.rss': feed.rss2(),
      'discovery.atom': feed.atom1(),
      'discovery.json': feed.json1()
    }
  }

  toHTML () {
    const elements = []
    let lastDate = ''
    this.visibleUpdates.reverse().forEach(entry => {
      const timestamp = new Date(entry.timestamp)
      const thisDate = dateFNS.format(timestamp, 'EEEE, do LLLL yyyy')
      if (lastDate !== thisDate) {
        lastDate = thisDate
        elements.push(html`<h2><time datetime="${dateFNS.format(timestamp, 'yyyy-MM-dd')}">${thisDate}</time></h2>`)
      }

      const providerName = (spiderConfigs[entry.provider] || { displayName: entry.provider }).displayName
      const providerURL = (spiderConfigs[entry.provider] || { link: entry.providerLink }).link
      const providerLink = html`<a href="${providerURL}" class="provider-link p-author h-card">${providerName}</a>`
      const verb = entry.verb || 'documented'
      const entryLink = html`<a href="${entry.link}" class="entry-link p-name u-url">${[...entry.words].flat(2).slice(0, 3).join(', ').trim()}</a>`
      elements.push(html`<div class="discovery-link h-entry">
        <time datetime="${timestamp.toISOString()}" class="dt-published entry-timestamp">${thisDate}</time>
        ${providerLink}
        ${verb}
        ${entryLink}
      </div>`)
    })

    return html`<main>
      <div id="recently-added-list" class="inset-box h-feed">
        <a href="${fullURL('feeds/discovery.rss')}" class="icon-feed" title="RSS Feed">${icon('feed')}</a>
        ${elements}
      </div>
    </main>`
  }
}

module.exports = FeedProvider
