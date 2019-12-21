// This script creates a torrent with webseed fields, so a regular BitTorrent app that supports
// BEP-0019 can download a full up to date copy of the website's datasets, enabling end users
// to mirror the find-sign website by git cloning the source from github and then using the
// regularly rebuilt torrent to grab a full copy of the up to date datasets directory

const createTorrent = require('create-torrent')
const fs = require('fs')

var opts = {
  name: "datasets",
  comment: "Find Sign (Australian Sign Language Search Engine) live datasets directory.",
  createdBy: "WebTorrent / tools/create-datasets-torrent.js",
  urlList: ["https://find.auslan.fyi/"]
}

console.log("Creating torrent...")
createTorrent('../datasets', opts, (err, torrent) => {
  if (!err) {
    // `torrent` is a Buffer with the contents of the new .torrent file
    fs.writeFile('../datasets.torrent', torrent, (err) => {
      if (err) console.error(err)
      else console.log("Finished.")
    })
    
  }
})