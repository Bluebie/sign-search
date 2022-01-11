import { readFile } from 'fs/promises'
import { iter_decode as iterateCBOR } from 'cbor-codec'
import { parse as parseYAML } from 'yaml'

const discoveryFeedLength = 20

export const isLive = true

export async function getProps () {
  const updatesLogData = await readFile('../datasets/update-log.cbor')
  const updatesLog = [...iterateCBOR(updatesLogData)]

  const spidersConfigData = await readFile('./spiders/configs.json')
  const spidersConfig = parseYAML(spidersConfigData.toString('utf-8'))

  return {
    feed: updatesLog.filter(entry => entry.available).slice(-discoveryFeedLength).map(entry => {
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
  }
}
