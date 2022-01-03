<svelte:head>
  <title>Random Sign</title>
</svelte:head>

<script>
  import ResultTile from './widgets/result-tile.svelte'

  let result
  // const blockedTags = [
  //   'description', // block signpedia-like entries, not established signs
  //   'invented', // block toddslan-like entries
  //   'lexis.crude', // block rude signbank stuff, want relatively unshocking kid friendly results
  //   'semantic.sexuality' // block formal register sexual body parts type of words
  // ]

  // const qs = (...args) => document.querySelector(...args)
  // const qsa = (...args) => document.querySelectorAll(...args)

  // async function randomize() {
  //   const index = window.ui.searchEngine.searchLibrary.index
  //   const randomEntry = index[Math.round(Math.random() * (index.length - 1))]

  //   if (blockedTags.some(x => randomEntry.tags.includes(x))) {
  //     // we don't want description entries like signpedia, and new ideas like toddslan in here, so just reroll
  //     return await randomize()
  //   }

  //   const resultTile = new window.ui.ResultTile({
  //     result: randomEntry,
  //     classList: ['expand'],
  //     onChange () {
  //       window.ui.morph(qs('.result'), resultTile.toHTML())
  //     }
  //   })

  //   const prevHeight = window.getComputedStyle(qs('.result')).height
  //   window.ui.morph(qs('.result'), resultTile.toHTML())
  //   if (!randomEntry.isFetched()) {
  //     qs('.result').style.height = prevHeight // preserve previous height to avoid scroll jumping issue in safari
  //     await randomEntry.fetch()
  //     window.ui.morph(qs('.result'), resultTile.toHTML())
  //   }
  // }

  // async function run() {
  //   await window.ui.awaitReady()

  //   // hook up the reroll button
  //   const rerollButton = document.getElementById('reroll')
  //   rerollButton.disabled = false
  //   rerollButton.addEventListener('click', () => {
  //     randomize()
  //   })

  //   randomize()
  // }
</script>

<main>
  <h1>Random Sign Generator</h1>

  <h2><button id=reroll disabled>🎲 Reroll</button></h2>

  <ResultTile bind:this={result}/>

  <div style="height: 20em"></div>
</main>
