<svelte:head>
  <title>Find Sign</title>
  <link rel=alternate title="Recently Added (JSON)" type="application/json" href="https://find.auslan.fyi/feeds/discovery.json">
  <link rel=alternate title="Recently Added (Atom)" type="application/atom+xml" href="https://find.auslan.fyi/feeds/discovery.atom">
  <link rel=alternate title="Recently Added (RSS)" type="application/rss+xml" href="https://find.auslan.fyi/feeds/discovery.rss">
  <meta name=viewport content="width=device-width">
  <link rel=icon type="image/png" sizes="32x32" href="/style/favicon-32x32.png">
  <meta property="og:image" content="https://find.auslan.fyi/style/assets/open-graph-image@3x.png">
  <meta property="og:description" content="Find Sign is an Auslan Search Engine. It helps find Auslan resources from around the internet in one place. Deaf community can send websites and videos to include and help make Auslan vocabulary easier to find.">
  <meta property="og:title" content="Find Sign - Auslan Search Engine">
</svelte:head>

<script>
  import PageHeader from './widgets/page-header.svelte'
  import DiscoveryFeed from './widgets/discovery-feed.svelte'

  export let query = ''
  export let showNavigation = true
  export let feed = []
</script>

<PageHeader {query} {showNavigation}></PageHeader>

<DiscoveryFeed {feed}/>

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