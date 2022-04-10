// Search Index v4 format
// implements both read and write functionality
const SearchResultDefinition = require('./result-definition')
const Util = require('../sign-search-utils')
const VU = require('../vector-utilities')
const cbor = require('borc')
const Buffer = require('buffer')

class SearchLibrary {
  // Build a SearchLibrary interface
  // config object should at least contain:
  //   fs: an object, which is a promisified version of node's fs (e.g. fs-extra package), or at least a readFile function for client side web use
  //   path: path to the folder in which the search library will be read or built
  // if you are using word vector searching (you should!!) you will also need
  //   vectorLibrary: an open instance of ../vector-library/reader.js, backed by a suitable word vector dataset (this can be generated from fasttext using utilities in /tools)
  // for server side index building, you'll also need to provide:
  //   mediaCache: an object which responds to the interface of ./media-cache.js, which can transcode, cache, and give out relative paths to encoded video files
  //   mediaFormats: an array, containing initialized media encoders, implementing the interface found in media-format-handbrake.js
  constructor (config = {}) {
    // search index data, contains a list of definitions
    this.index = []
    // default settings - this data is written in to the search index and controls parsing
    this.settings = {
      version: 4,
      vectorBits: 8,
      vectorSize: 300,
      vectorScaling: 0, // this is automatically calculated in the save() step
      buildTimestamp: Date.now(),
      mediaSets: [],
      buildID: Date.now()
    }
    // override defaults with any configued options with matching keys
    Object.keys(this.settings).forEach(key => {
      this.settings[key] = config[key] || this.settings[key]
    })

    // config object stores any extra stuff too
    this.config = Object.assign({
      definitionsPerShard: 50 // default
    }, config)
    this.path = config.path
    this.webURL = config.webURL || config.path
    if (!this.path) throw new Error('path option is not optional') // verify a path was supplied

    // setup mediaSets data
    this.settings.mediaSets = (config.mediaFormats || []).map(x => x.getMediaInfo())
  }

  // internal: log something
  log (...args) {
    if (this.config.log) {
      this.config.log(...args)
    } else {
      console.log(...args)
    }
  }

  // internal: writes a file with a gzip version as well
  writeCompressed (filename, buffer) {
    const tasks = []
    this.config.fs.writeFile(filename, buffer)
    if (this.config.gzip) {
      const gzipWriter = async () => this.config.fs.writeFile(`${filename}.gz`, await this.config.gzip(buffer))
      tasks.push(gzipWriter())
    }
    if (this.config.brotli) {
      const brotliWriter = async () => this.config.fs.writeFile(`${filename}.br`, await this.config.brotli(buffer))
      tasks.push(brotliWriter())
    }
    return Promise.all(tasks)
  }

  // open a search index, loading all search results in to memory. They can then be modified and @save(path) can be used to write out the modified version
  async loadEverything () {
    await this.open(this.path)

    // prefetch all the definitions too
    for (const result of this.index) {
      await result.fetch()
    }
  }

  // open a search index at a certain path, this should be the path to the root directory, without a trailing slash
  async open () {
    // decode the search index data using cbor
    const data = cbor.decode(await this.config.fs.readFile(`${this.path}/index.cbor`))

    // copy in the settings object
    if (data.settings.version !== 4) throw new Error('Search Library implements a different format version to file opened')
    this.settings = data.settings

    // import the symbols, converting buffers in to vectors
    const symbols = data.symbols.map(value => {
      if (typeof value === 'string') { // strings are just imported directly
        return value
      } else if (Buffer.isBuffer(value)) { // decode a vector
        const floats = Util.unpackFloats(value, this.settings.vectorBits, this.settings.vectorSize)
        return floats.map(f => f * this.settings.vectorScaling)
      } else {
        throw new Error('symbols must be strings or buffers, invalid document')
      }
    })

    // decode the search index structure
    this.index = []
    // the root is a map with arrays of tag symbols as keys and arrays of entries as values
    for (const [tagSymbols, entries] of data.index) {
      const tags = tagSymbols.toString().split(',').map(index => symbols[index])
      // for each entry in the tag list, we get a number of definitions associated with a term list
      for (const [termSymbols, definitionPaths] of entries) {
        const terms = termSymbols.toString().split(',').map(index => symbols[index])
        // create search result entries in the index for every definition behind this combination of tags and terms
        const termDiversity = Math.max(...VU.diversity(...terms.filter(x => Array.isArray(x))))
        Util.chunk(definitionPaths, 2).forEach((definitionPath) => {
          this.index.push(new SearchResultDefinition({
            library: this, definitionPath, tags, terms, termDiversity
          }))
        })
      }
    }

    return this
  }

  // accepts a SearchDefinition instance (see ./definition.js)
  // appends the search definition to the search index
  async addDefinition (definition) {
    const data = (definition.toJSON && definition.toJSON()) || definition
    let terms = data.keywords
    if (this.config.cleanupKeywords) {
      terms = terms.map(keyword => {
        // clean up keywords a bit
        let cleanedWord = keyword.trim().replace(/‘/g, "'")
        // if it's not all caps like an acronym, lowercase it
        if (cleanedWord.match(/[a-z]/) || cleanedWord.length < 2) cleanedWord = cleanedWord.toLowerCase()
        return cleanedWord
      })
    }

    // translate keywords in to vectors where possible
    terms = await Promise.all(terms.map(async keyword => (this.config.vectorLibrary && await this.config.vectorLibrary.lookup(keyword)) || keyword))

    // encode and cache any uncached media
    const media = []
    for (const mediaItem of data.media) {
      const capableEncoders = this.config.mediaFormats.filter(format => format.accepts(mediaItem.getExtension()))
      const versions = {}
      for (const encoder of capableEncoders) {
        versions[encoder.getMediaInfo().extension] = (await this.config.mediaCache.cache({ media: mediaItem, format: encoder })).relativePath
      }
      if (capableEncoders.length > 0) media.push(versions)
    }

    // build the search definition object
    const result = new SearchResultDefinition(Object.assign(data, {
      library: this,
      terms,
      termDiversity: Math.max(...VU.diversity(...terms.filter(x => Array.isArray(x)))),
      media,
      preloaded: true
    }))

    // add the search result definition to our index
    this.index.push(result)
  }

  // query the search index
  // filterFn will be called for every search result in the index, and should return a number, or false
  // when filterFn(result) returns false, the search result wont be included in the output
  // when filterFn(result) returns a number, it will be treated as a rank, and the results will be sorted according to this rank, with
  // lower numbers at the top of the list
  // Note: query checks if the index has been modified, by stating the index file, and will reload the index if the dataset has been
  // updated, so it will often return quickly, but may return slowly if the index needs to be reloaded.
  // Your UI should display a notice to the user if query is taking more than a moment to resolve, indicating results are loading.
  async query (filterFn) {
    const currentBuildID = await this.config.fs.readFile(`${this.path}/buildID.txt`)
    if (`${currentBuildID}` !== `${this.settings.buildID}`) {
      // we need to reload
      this.log(`Reloading dataset because dataset buildID is ${currentBuildID} but locally loaded dataset is ${this.settings.buildID}`)
      await this.open()
    }

    // call filterFn on a reference copy of the search results, storing rank to .distance property
    return this.index.map((result) => {
      const rankedResult = Object.create(result)
      rankedResult.distance = filterFn(result)
      return rankedResult
    }).filter(rankedResult =>
      // filter out any results that didn't return a Number
      typeof rankedResult.distance === 'number'
    ).sort((a, b) =>
      // sort results based on distance ranking
      a.distance - b.distance
    )
  }

  // returns an object with hashtags as keys, and number of known results featuring that tag as values
  async getTags () {
    const output = {}
    for (const result of this.index) {
      result.tags.forEach(tag => {
        output[tag] = (output[tag] || 0) + 1
      })
    }
    return output
  }

  // write everything out to the filesystem
  async save () {
    // Symbol table builder:
    const symbols = []
    const symbolsLookup = {}
    // symbol getter: accepts a string, or array of this.settings.vectorSize floats, and returns an integer index
    const symbol = (data) => {
      const lookupKey = JSON.stringify(data)
      if (symbolsLookup[lookupKey]) return symbolsLookup[lookupKey]

      // add this symbol to the symbol table
      const symbolIndex = symbols.length
      // scale vectors down
      if (Array.isArray(data)) {
        const floats = Util.packFloats(data.map(x => x / this.settings.vectorScaling), this.settings.vectorBits, this.settings.vectorSize)
        symbols.push(Buffer.from(floats))
      } else { // strings just go in as regular strings
        symbols.push(data.toString())
      }

      // return the index number of the symbol, and cache this answer for later
      symbolsLookup[lookupKey] = symbolIndex
      return symbolIndex
    }

    // figure out our ideal scaling factor if we're building with vectors
    if (this.config.vectorLibrary) {
      this.settings.vectorScaling = 0
      for (const definition of this.index) {
        const vectors = definition.terms.filter(x => typeof x !== 'string')
        if (vectors.length < 1) continue
        const localScaling = Math.max(...(vectors.flat().map(Math.abs)))
        if (this.settings.vectorScaling < localScaling) {
          this.settings.vectorScaling = localScaling
        }
      }
    }

    // generating shards data, scoped to a block to manage memory better
    const index = {} // object keyed by tag lists in the form "symbol\nsymbol\nsymbol" where symbols are sorted numbers from symbol()
    const dataPaths = {} // object mapping provider-id/resource-id to definition path
    {
      // generate shards
      this.log('Writing content out to shard files')
      let shardID = 0
      for (const batch of Util.chunkIterable(this.index, this.config.definitionsPerShard)) {
        const shardArray = []
        batch.forEach(definition => {
          // fetch existing definition array or create a new one
          definition._definitionPath = [shardID, shardArray.length]
          shardArray.push(definition.toJSON())

          if (!dataPaths[definition.provider]) dataPaths[definition.provider] = {}
          dataPaths[definition.provider][definition.id] = definition._definitionPath

          // add to index data structure
          // build tag list
          const tagList = definition.tags.map(symbol).sort((x, y) => x - y).join('\n')
          // find or create tag group
          const indexTagGroup = index[tagList] = index[tagList] || {}
          // find or create definition info & increment number of definitions
          const symbolList = definition.terms.map(symbol).sort((x, y) => x - y).join('\n')
          indexTagGroup[symbolList] = [...(indexTagGroup[symbolList] || []), ...definition._definitionPath]
        })

        // convert definitions to cbor
        const shardBuffer = cbor.encode(shardArray)
        await this.config.fs.ensureDir(`${this.path}/definitions/${this.settings.buildID}`)
        await this.writeCompressed(`${this.path}/definitions/${this.settings.buildID}/${shardID}.cbor`, shardBuffer)
        shardID += 1
      }
    }

    // write out the index file
    this.log('Encoding and writing index...')
    const indexBuffer = cbor.encode({
      settings: this.settings,
      symbols,
      index: Util.objectToMap(index,
        key => key.split('\n').map(x => parseInt(x)),
        termObject => Util.objectToMap(termObject,
          key => key.split('\n').map(x => parseInt(x))
        )
      )
    })
    await this.writeCompressed(`${this.path}/index.cbor`, indexBuffer)

    // write out paths.cbor
    this.log('Encoding and writing data-paths.cbor index...')
    await this.writeCompressed(`${this.path}/data-paths.cbor`, cbor.encode(dataPaths))

    // generate the buildID file, so client side apps can easily check if the index they have loaded is up to date
    await this.config.fs.writeFile(`${this.path}/buildID.txt`, this.settings.buildID.toString())
  }

  // garbage collection of old unneeded files
  async cleanup (keepBuildIDs = []) {
    // clean up old definitions that are now obsolete
    const builds = await this.config.fs.readdir(`${this.path}/definitions`)
    for (const buildID of builds) {
      if (buildID !== this.settings.buildID && !keepBuildIDs.includes(buildID)) {
        this.log(`Removing old definitions build "${buildID}"`)
        await this.config.fs.remove(`${this.path}/definitions/${buildID}`)
      }
    }
    // clean up old media in the cache that is no longer referenced
    await this.config.mediaCache.cleanup()
  }

  // Internal:
  // fetches a shard file, and loads it in to all SearchResultDefinition objects which it has data for
  async _fetchDefinitionData (result) {
    // calculate url, load shard file, decode it
    const shardID = result._definitionPath[0]
    const shardBuffer = await this.config.fs.readFile(`${this.path}/definitions/${this.settings.buildID}/${shardID}.cbor`)
    const shardData = cbor.decode(shardBuffer)
    return shardData[result._definitionPath[1]]
  }
}

module.exports = SearchLibrary
