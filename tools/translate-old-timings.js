// translates old asphyxia timing files to new srt format
const subsParser = require('subtitles-parser-vtt')
const fs = require('fs-extra')

async function parseTimingFile(textData) {
  let lines = textData.split("\n").filter(x => !x.match(/^#/) && x.trim().length > 0)
  let [youtubeID, label] = lines.shift().split(' - ', 2)
  let youtubeURL = `https://www.youtube.com/watch?v=${ youtubeID.trim() }`

  let currentTimestamp = 0, m = null, output = []
  for (let line of lines) {
    if (m = line.trim().match(/^([0-9:.]+) ([^\n>]+)( > (.*))?$/)) {
      let [_, timestampStr, words, _2, body] = m
      let time = parseFloat(timestampStr.split(':', 2)[0]) * 60
      time += parseFloat(timestampStr.split(':', 2)[1])
      if (output.length > 0) output.slice(-1)[0].end = time
      if (words.trim().toLowerCase() != "#end") {
        let tagList = new Set()
        let negativeTags = new Set()

        body = body ? body.replace(/ *-#([a-zA-Z0-9_-]+) */gi, (input, p1)=> {
          negativeTags.add(p1.trim())
          return ' '
        }).trim() : false

        body = body ? body.replace(/ *#([a-zA-Z0-9_-]+) */gi, (input, p1)=> {
          tagList.add(p1.trim())
          return ' '
        }).trim() : false

        negativeTags.forEach((tag) => tagList.delete(tag))

        output.push({
          start: time,
          end: false,
          words: words.split(',').map(x => x.trim()),
          tags: [...tagList],
          body: body
        })
      }
    }
  }
  return {
    videoID: youtubeID,
    sequence: output
  }
}

async function importFile(inputFilename, outputDirectory) {
  let parsed = await parseTimingFile((await fs.readFile(inputFilename)).toString('utf-8'))
  let outputFilename = `${outputDirectory}/${parsed.videoID}.srt`

  let srtData = parsed.sequence.filter(({words}) => !words.includes('#skip')).map(
  ({ start, end, words, tags, body }, idx) => (
    {
      id: idx + 1,
      text: `${words.join(', ')}\n${`${body || ''}${tags.map(x => ` #${x}`).join('')}`.trim()}`.trim(),
      startTime: Math.round(start * 1000),
      endTime: Math.round((end ? end : start + 60) * 1000)
    }
  ))

  await fs.writeFile(outputFilename, subsParser.toSrt(srtData))
}

async function run() {
  let inputDir = './scrapers/asphyxia/timing'
  let outputDir = './spiders/asphyxia-subtitles'

  let files = await fs.readdir(inputDir)
  await fs.ensureDir(outputDir)
  for (let file of files) {
    if (!file.match(/\.txt$/)) continue
    console.log(`Converting ${file}`)
    await importFile(`${inputDir}/${file}`, outputDir)
  }
}

run()