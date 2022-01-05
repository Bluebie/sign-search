<svelte:head>
  <title>Random Sign</title>
</svelte:head>

<script>
  import ResultTile from './widgets/result-tile.svelte'
  import { onMount } from 'svelte'
  import { open, getResult } from '../library/search-index.mjs'
  // const SearchLibrary = require('../lib/search-library/library-web')

  // const library = {}new SearchLibrary({
  //   path: 'datasets/search-index'
  // })

  const blockedTags = [
    'signpedia', // block signpedia-like entries, not established signs
    'invented', // block toddslan-like entries
    'lexis.crude', // block rude signbank stuff, want relatively unshocking kid friendly results
    'semantic.sexuality' // block formal register sexual body parts type of words
  ]

  let result
  let library

  $: console.log(result)

  async function reroll () {
    // clear current result
    result = undefined
    const random = Object.create(library.index[Math.round(Math.random() * (library.index.length - 1))])
    const tagMatch = blockedTags.some(x => random.tags.includes(x))
    if (!tagMatch) {
      // load the result and set it up as the answer
      result = await getResult(library, random)
    } else {
      reroll()
    }
  }

  onMount(async () => {
    library = await open('datasets/search-index')
    reroll()
  })
</script>

<main>
  <h1>Random Sign Generator</h1>

  <h2><button disabled={!library} on:click={reroll}>🎲 Reroll</button></h2>

  <ResultTile bind:result={result}/>

  <div style="height: 20em"></div>
</main>

<style>
  :global(*) {
    box-sizing: border-box; /* i just like it better ok? microsoft was right */
  }

  :global(body) {
    width: 900px;
    margin-left: auto;
    margin-right: auto;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background-color: var(--base-bg);
    color: var(--base-fg);
  }
</style>