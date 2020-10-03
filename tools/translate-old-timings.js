// translates old asphyxia timing files to new srt format
const subsParser = require('subtitles-parser-vtt')
const fs = require('fs-extra')

async function parseTimingFile (textData) {
  const lines = textData.split('\n').filter(x => !x.match(/^#/) && x.trim().length > 0)
  const [youtubeID] = lines.shift().split(' - ', 2)

  let m = null
  const output = []
  for (const line of lines) {
    if ((m = line.trim().match(/^([0-9:.]+) ([^\n>]+)( > (.*))?$/))) {
      const timestampStr = m[1]
      const words = m[2]
      let body = m[4]

      let time = parseFloat(timestampStr.split(':', 2)[0]) * 60
      time += parseFloat(timestampStr.split(':', 2)[1])

      if (output.length > 0) output.slice(-1)[0].end = time
      if (words.trim().toLowerCase() !== '#end') {
        const tagList = new Set()
        const negativeTags = new Set()

        body = body ? body.replace(/ *-#([a-zA-Z0-9_-]+) */gi, (input, p1) => {
          negativeTags.add(p1.trim())
          return ' '
        }).trim() : false

        body = body ? body.replace(/ *#([a-zA-Z0-9_-]+) */gi, (input, p1) => {
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

async function importFile (inputFilename, outputDirectory) {
  const parsed = await parseTimingFile((await fs.readFile(inputFilename)).toString('utf-8'))
  const outputFilename = `${outputDirectory}/${parsed.videoID}.srt`

  const srtData = parsed.sequence
    .filter(({ words }) => !words.includes('#skip'))
    .map(({ start, end, words, tags, body }, idx) => ({
      id: idx + 1,
      text: `${words.join(', ')}\n${`${body || ''}${tags.map(x => ` #${x}`).join('')}`.trim()}`.trim(),
      startTime: Math.round(start * 1000),
      endTime: Math.round((end || start + 60) * 1000)
    }))

  await fs.writeFile(outputFilename, subsParser.toSrt(srtData))
}

async function run () {
  const inputDir = './scrapers/asphyxia/timing'
  const outputDir = './spiders/asphyxia-subtitles'

  const files = await fs.readdir(inputDir)
  await fs.ensureDir(outputDir)
  for (const file of files) {
    if (!file.match(/\.txt$/)) continue
    console.log(`Converting ${file}`)
    await importFile(`${inputDir}/${file}`, outputDir)
  }
}

run()
