// Feed Provider generates a feed of recently added content, to add to the homepage, or to the discovery feeds
const html = require('nanohtml')
const fs = require('fs-extra')
const cbor = require('borc')

const Feed = require('feed').Feed
const dateFNS = require('date-fns')
const xml2js = require('xml2js')
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

    const newsfeedGot = await got(signSearchConfig.newsRSS)
    const newsfeed = await xml2js.parseStringPromise(newsfeedGot.body)
    newsfeed.rss.channel[0].item.forEach(item => {
      let title = item.title[0]
      if (title.length > maxTitleLength) title = `${title.slice(0, maxTitleLength - 1)}…`
      this.visibleUpdates.push({
        provider: newsfeed.rss.channel[0].title[0] || 'News',
        providerLink: newsfeed.rss.channel[0].link[0],
        verb: 'posted',
        link: item.link[0],
        timestamp: Date.parse(item.pubDate[0]),
        words: [title],
        body: item.description[0],
        available: true
      })
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
