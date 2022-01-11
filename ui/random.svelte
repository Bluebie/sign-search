<svelte:head>
  <title>Random Sign</title>
</svelte:head>

<script>
  import PageHeader from './widgets/page-header.svelte'
  import ResultTile from './widgets/result-tile.svelte'
  import { onMount } from 'svelte'
  import { open, freshen, getResult } from '../library/search-index.mjs'
  import { fade } from 'svelte/transition'

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
    library = await freshen(library)
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

  async function search (query) {
    window.location.href = `/#${encodeURIComponent(query)}/0`
  }
</script>

<PageHeader queryHandler={search}/>

<main>
  <h1>Random Sign Generator</h1>

  <h2><button disabled={!library} on:click={reroll}>🎲 Reroll</button></h2>

  {#if result}
    <div class="result-box" transition:fade={{ duration: 100 }}>
      <ResultTile bind:result={result} expand/>
    </div>
  {:else}
    <div class=spacer></div>
  {/if}

  <div style="height: 20em"></div>
</main>

<style>
  :global(*) {
    box-sizing: border-box; /* i just like it better ok? microsoft was right */
  }

  :global(body) {
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background-color: var(--base-bg);
    color: var(--base-fg);
  }

  h2 button {
    --button-hue: calc(var(--hue) - 45deg);
    width: 100%;
    display: block;
    background-color: hsl(var(--button-hue), var(--module-bg-sat), var(--module-bg-lum));
    color: hsl(var(--button-hue), var(--base-fg-sat), var(--base-fg-lum));
    appearance: none;
    padding: 1ex 1em;
    border-radius: calc((1em + 2ex) / 2);
    line-height: 1;
    border: 0 none;
    font-size: inherit;
    font-weight: inherit;
  }

  h2 button:enabled:hover {
    background-color: hsl(var(--button-hue), var(--submodule-bg-sat), var(--submodule-bg-lum));
    cursor: pointer;
  }

  .spacer {
    height: 200vh;
  }
</style>