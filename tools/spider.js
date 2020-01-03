const fs = require('fs-extra')
const cbor = require('borc')
const util = require('util')

const VectorLibraryReader = require('../lib/vector-library/reader')
const SearchLibraryWriter = require('../lib/search-library/writer')


class OnDemandMediaLoader {
  constructor(spider, content, videoInfo) {
    this.spider = spider
    this.content = content
    this.info = videoInfo
    if (this.info.clipping) this.clipping = this.info.clipping
  }

  // get a unique key that should change if the video's content changes
  async getKey() {
    return this.spider.hash(`${this.content.hash}${JSON.stringify(this.info)}`)
  }

  // get path to video file - if no path exists, 
  async getVideoPath() {
    try {
      this.localFilename = await this.spider.fetch(this.content, this.info)
    } catch (e) {
      console.log(`Error: ${e}:`)
      console.log(`Trying again...`)
      this.localFilename = await this.spider.fetch(this.content, this.info)
    }
    return this.localFilename
  }

  // once it's imported completely, we can remove the file we downloaded temporarily
  async releaseVideoPath() {
    await fs.unlink(this.localFilename)
  }
}


async function run() {
  let configs = JSON.parse(await fs.readFile('./spiders/configs.json'))

  let vectorLibrary = new VectorLibraryReader()
  await vectorLibrary.open('../datasets/vectors-cc-en-300-8bit')

  for (let source of Object.keys(configs)) {
    console.log(`Getting ready to spider ${source}...`)
    let sourceConfig = configs[source]
    let spiderClass = require(`./spiders/${sourceConfig.spider}.js`)
    let spider = new spiderClass(sourceConfig)

    if (await fs.pathExists(`./spiders/frozen-data/${source}.cbor`)) {
      await spider.load(await fs.readFile(`./spiders/frozen-data/${source}.cbor`))
      console.log(`Previous state restored`)
    }

    let originalContentKeys = Object.keys(spider.content)

    // setup the task list, with the initial root task []
    let tasks = [[]]
    let completedTasks = new Set()
    
    while (tasks.length > 0) {
      // get the next task from the queue
      let nextTask = tasks.shift()

      // if we did this task already, skip it
      if (completedTasks.has(cbor.encode(nextTask))) continue
      
      console.log(`Running index task: spider.index(${nextTask.map(a => util.inspect(a)).join(', ')})`)
      let result = await spider.index(...nextTask)

      // add the next task to the completed tasks list
      completedTasks.add(cbor.encode(nextTask))

      if (result && result.tasks) {
        result.tasks.forEach(t => tasks.push(t))
      }
    }

    console.log(`Index tasks have completed! Building search library...`)

    // build search library
    let libraryPath = `../datasets/${source}`
    await fs.ensureDir(libraryPath)

    let searchLibrary = await (new SearchLibraryWriter(libraryPath, {
      format: 'sint8',
      scaling: 8,
      vectorDB: vectorLibrary,
      shardBits: Math.max(1, Math.ceil(Object.keys(spider.content).length / Math.log(2) - 4))
    })).open()

    // loop through accumulated content, writing it in to the searchLibrary and fetching any media necessary
    for (let content of Object.values(spider.content)) {
      console.log(`Importing ${content.id}: ${content.words.join(' ')}`)
      await searchLibrary.append({
        words: content.words,
        tags: [...(sourceConfig.tag || []), ...content.tags],
        videoPaths: content.videos.map(v => new OnDemandMediaLoader(spider, content, v)),
        lastChange: content.timestamp,
        def: {
          link: content.link,
          glossList: (content.title ? [content.title] : content.words),
          body: content.body
        }
      })
    }
  
    await searchLibrary.finish()
  
    console.log(`Finished building ${source} library`)

    await fs.writeFile(`./spiders/frozen-data/${source}.cbor`, await spider.store())

    // detect newly found content
    let newContentKeys = Object.keys(spider.content).filter(key => !originalContentKeys.includes(key))
    // build a list of new content
    for (let key of newContentKeys) {
      let content = spider.content[key]
      console.log(`New: ${content.link} - ${content.words}`)
      await fs.appendFile(`../datasets/update-log.cbor`, cbor.encode({
        timestamp: content.timestamp || Date.now(),
        words: content.words,
        link: content.link,
        provider: source
      }))
      await fs.appendFile(`../datasets/update-log.txt`, 
        `provider: ${source}; timestamp: ${content.timestamp || Date.now()}; words: ${content.words}; link: ${content.link}\n`
      )
    }
  }
}

run()