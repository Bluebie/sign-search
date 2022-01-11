<svelte:head>
  <title>Find Sign</title>
  <link rel=alternate title="Recently Added (JSON)" type="application/json" href="https://find.auslan.fyi/feeds/discovery.json">
  <link rel=alternate title="Recently Added (Atom)" type="application/atom+xml" href="https://find.auslan.fyi/feeds/discovery.atom">
  <link rel=alternate title="Recently Added (RSS)" type="application/rss+xml" href="https://find.auslan.fyi/feeds/discovery.rss">
  <meta name=viewport content="width=device-width">
  <link rel=icon type="image/png" sizes="32x32" href="/style/favicon-32x32.png">
  <meta property="og:image" content="https://find.auslan.fyi/style/assets/open-graph-image@3x.png">
  <meta property="og:description" content="Find Sign is an Auslan Search Engine. It helps find Auslan resources from around the internet in one place.">
  <meta property="og:title" content="Find Sign - Auslan Search Engine">
</svelte:head>

<script>
  import PageHeader from './widgets/page-header.svelte'
  import DiscoveryFeed from './widgets/discovery-feed.svelte'
  import ResultTile from './widgets/result-tile.svelte'
  import Notice from './widgets/notice.svelte'
  import { fade } from 'svelte/transition'
  import { onMount, tick } from 'svelte'
  import * as vec from '../library/precomputed-vectors.mjs'
  import * as search from '../library/search-index.mjs'
  import { compileQuery, normalizeWord } from '../library/text.mjs'
  import rank from '../library/search-rank.mjs'
  import Paginator from './widgets/paginator.svelte'
  import delay from './functions/delay.mjs'

  const resultsPerPage = 10
  const maxPages = 9
  const resultDelay = 100

  export let query
  export let feed
  let searchLibrary
  let vectorLibrary

  let results
  let currentPage = 0

  $: displayResults = Array.isArray(results) && results.slice(currentPage * resultsPerPage, (currentPage + 1) * resultsPerPage).map(async (entry, idx) => {
    await delay(resultDelay * idx)
    return await search.getResult(searchLibrary, entry)
  })

  onMount(async () => {
    [vectorLibrary, searchLibrary] = await Promise.all([
      vec.open('datasets/cc-en-300-8bit'),
      search.open('datasets/search-index')
    ])
  })

  async function runQuery (query) {
    if (query === '' || !query) {
      results = undefined
      return
    }

    // wait for data to load
    while (!searchLibrary || !vectorLibrary) await tick()
    // compile query in to ranking function
    const rankFn = await compileQuery(query, (word) => vec.lookup(vectorLibrary, normalizeWord(word)))
    results = rank(searchLibrary, rankFn).index
    currentPage = 0
  }
</script>

<PageHeader bind:query showNavigation={!results} queryHandler={runQuery} />

{#if displayResults}
  <ol class=results>
    {#if displayResults.length === 0}
      <li><Notice>No results found. Try rephrasing search phrase, or check spelling.</Notice></li>
    {/if}
    {#each displayResults as promise}
      <li class=result transition:fade>
        {#await promise}
          <ResultTile/>
        {:then result}
          <ResultTile {result}/>
        {:catch err}
          <Notice>Error: {err.message}</Notice>
        {/await}
      </li>
    {/each}
  </ol>

  <Paginator
    bind:selected={currentPage}
    length={Math.min(maxPages, results.length / resultsPerPage)}
    toURL={(pageNum) => `search?query=${encodeURIComponent(query)}&page=${pageNum}`}
  />
{:else if feed}
  <DiscoveryFeed {feed}/>
{/if}

<style>
  :global(*) {
    box-sizing: border-box; /* i just like it better ok? microsoft was right */
  }

  :global(body) {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background-color: var(--base-bg);
    color: var(--base-fg);
  }

  .results {
    list-style-type: none;
    padding: 0;
  }
</style>