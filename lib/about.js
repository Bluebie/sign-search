async function run() {
  await ui.waitUntilReady()
  let tags = await ui.getTags()
  let sortedNames = Object.keys(tags).sort((a,b)=> tags[b] - tags[a])
  let list = $('#hashtags_list').empty()
  sortedNames.forEach(tag => {
    let li = $('<li></li>')
    li.append($('<a></a>').text(`#${tag}`).attr('href', `./#${encodeURIComponent(`#${tag}`)}/0`))
    li.append($('<span></span>').text(` (${tags[tag]} results)`))
    list.append(li)
  })
}

window.addEventListener('load', (event) => {
  console.log("Building tags list")
  run()
})