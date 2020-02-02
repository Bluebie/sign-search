// general utilities library of useful functions that get reused a lot
const fs = require('fs-extra')
const crypto = require('crypto')

const appRootPath = require('app-root-path')
const signSearchConfig = appRootPath.require('package.json').signSearch
const URL = require('url').URL

let ViewUtils = {
  // accepts a path, relative to root of site, and hashes the file it references, creating a relative url to embed in html
  // this ensures any caching happening in browser is invalidated
  decache: (path)=> {
    let hash = crypto.createHash('sha256')
    hash.update(fs.readFileSync(appRootPath.resolve(path)))
    return `${ViewUtils.pathURL(path)}?${hash.digest('hex').slice(0, 8)}`
  },

  // adjust paths for inclusion in HTML to take in to account mount point in site
  pathURL: (localPath)=> {
    let siteLocation = new URL(signSearchConfig.location)
    let url = new URL(localPath, siteLocation)
    if (siteLocation.origin == url.origin) {
      return url.pathname
    } else {
      return url.toString()
    }
  },

  // convert a local path in to a full URL
  fullURL: (localPath)=> {
    let siteLocation = new URL(signSearchConfig.location)
    let url = new URL(localPath, siteLocation)
    return url.toString()
  },

  // accepts a full or relative link, and finds local path on filesystem
  urlToLocalPath: (link)=> {
    let url = new URL(link, signSearchConfig.location)
    return (appRootPath + url.pathname)
  },
}

module.exports = ViewUtils