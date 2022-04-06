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
  const resultDelay = 25

  export let query = ''
  export let feed
  export let page = 0
  let searchLibrary
  let vectorLibrary
  let results

  $: displayResults = Array.isArray(results) && results.slice(page * resultsPerPage, (page + 1) * resultsPerPage).map(async (entry, idx) => {
    await delay(resultDelay * idx)
    return await search.getResult(searchLibrary, entry)
  })

  onMount(async () => {
    [vectorLibrary, searchLibrary] = await Promise.all([
      vec.open('datasets/cc-en-300-8bit'),
      search.open('datasets/search-index')
    ])

    if (window.location.hash.length > 1) {
      onHashChange()
    }
  })

  async function runQuery (newQuery) {
    query = newQuery
    results = undefined
    page = 0
    window.location.hash = `#${new URLSearchParams({ query, page })}`
    if (query === '' || !query) {
      return
    }

    // wait for data to load
    while (!searchLibrary || !vectorLibrary) await tick()
    // compile query in to ranking function
    const rankFn = await compileQuery(query, (word) => vec.lookup(vectorLibrary, normalizeWord(word)))
    results = rank(searchLibrary, rankFn).index
  }

  async function onHashChange () {
    console.log('hash change', window.location.hash)
    const params = new URLSearchParams((window.location.hash || '').slice(1))
    if (params.has('query') && query !== params.get('query')) {
      await runQuery(params.get('query'))
    }

    if (params.has('page') && page !== parseInt(params.get('page'))) {
      page = parseInt(params.get('page'))
    }
  }

  async function onStateChange () {
    await tick()
    if (query === '') {
      window.location.hash = ''
    } else {
      window.location.hash = `#${new URLSearchParams({ query, page })}`
    }
  }
</script>

<svelte:window on:hashchange={onHashChange}/>

<PageHeader bind:query showNavigation={!results} queryHandler={onStateChange} />

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
    bind:selected={page}
    length={Math.min(maxPages, results.length / resultsPerPage)}
    toURL={(page) => `search?${new URLSearchParams({ query, page })}`}
    on:change={onStateChange}
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
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    padding: 0;
  }
</style>