// general utilities library of useful functions that get reused a lot
const fs = require('fs-extra')
const crypto = require('crypto')

const signSearchConfig = require('../../package.json').signSearch
const URL = require('url').URL

const ViewUtils = {
  // accepts a path, relative to root of site, and hashes the file it references, creating a relative url to embed in html
  // this ensures any caching happening in browser is invalidated
  decache: (path) => {
    if (fs.pathExistsSync(require.resolve(`../../${path}`))) {
      const hash = crypto.createHash('sha256')
      hash.update(fs.readFileSync(require.resolve(`../../${path}`)))
      return `${ViewUtils.pathURL(path)}?${hash.digest('hex').slice(0, 8)}`
    } else {
      return ViewUtils.pathURL(path)
    }
  },

  // adjust paths for inclusion in HTML to take in to account mount point in site
  pathURL: (localPath) => {
    const siteLocation = new URL(signSearchConfig.location)
    const url = new URL(localPath, siteLocation)
    if (siteLocation.origin === url.origin) {
      return url.pathname
    } else {
      return url.toString()
    }
  },

  // convert a local path in to a full URL
  fullURL: (localPath) => {
    const siteLocation = new URL(signSearchConfig.location)
    const url = new URL(localPath, siteLocation)
    return url.toString()
  },

  // accepts a full or relative link, and finds local path on filesystem
  urlToLocalPath: (link) => {
    const url = new URL(link, signSearchConfig.location)
    return require.resolve('../..' + url.pathname)
  }
}

module.exports = ViewUtils
