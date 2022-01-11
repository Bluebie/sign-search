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
  import { fade } from 'svelte/transition'
  import Paginator from './widgets/paginator.svelte'

  export let query = ''
  export let showNavigation = true
  export let feed = []
  const resultsPerPage = 10
  const maxPages = 9

  export let query
  export let feed
  let searchLibrary
  let vectorLibrary

  let results
  let currentPage = 0

  $: displayResults = Array.isArray(results) && results.slice(currentPage * resultsPerPage, resultsPerPage).map(entry => {
    return search.getResult(searchLibrary, entry)
  })
</script>

<PageHeader bind:query showNavigation={!results} queryHandler={runQuery} />

{#if displayResults}
  <ol class=results>
    {#each displayResults as promise, index}
      <li class=result transition:fade>
        {#await promise}
          <ResultTile/>
        {:then result}
          <ResultTile {result}/>
        {/await}
      </li>
    {/each}
  </ol>

  <Paginator
    bind:selected={currentPage}
    length={Math.min(maxPages, results.length / resultsPerPage)}
    toURL={(id) => `#${encodeURIComponent(query)}/${id}`}
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
  }
</style>