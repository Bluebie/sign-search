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
</script>

<PageHeader/>

<main>
  <h1>Spider</h1>
  <p>
    A “Spider” is a computer program. The Spider goes to different websites, explores, finds new things, and
    makes notes. When finished, it’s notes are organised in to files describing everything it has seen.
  </p>
  <h1>Word Embedding</h1>
  <p>
    The next step is “Word Embedding”. A complicated topic! Word embedding creates a map, with coordinates,
    and puts each word on the map in it’s own location. Artificial Intelligence research from written language
    translation websites is used. English words that have a similar meaning, are grouped in to close areas on
    the map. This is important! Similar ideas are in similar areas in the map.
  </p>
  <h1>Search</h1>
  <p>
    When you search for a word, your computer does this:
  </p>
  <ol>
    <li>Download a map of all the signs the spider found, and what kind of meaning they have</li>
    <li>Look at the Word Embedding map, and find the word you searched for, remembering the location</li>
    <li>Check every sign, and see how close it’s meaning is, to the word you entered, by how far away they are
    on the map</li>
    <li>Make a list, organised so the closest signs are at the top</li>
    <li>Download small videos and descriptions, and create the webpage, with results listed down the page</li>
  </ol>
  <h1>Privacy and Tracking</h1>
  <p>
    We use a program called Fathom to see how many people use this website, and to find out what website they
    came from if they clicked a link to come here. When you do a search, we don’t find out what words you typed
    in to the search box. We might be able to guess what kind of thing you were looking at, by seeing which search
    results your computer downloaded, but we don’t know exactly what you wrote. We don’t send your information to
    Google or Facebook at all, but if you come here using one of their apps like Google Chrome or Facebook App, they
    might be able to track you while you use their app.
  </p>
  <h1>Open Source and Dataset</h1>
  <p>
    Find Sign is open source (mostly with Unlicense software license). You can get the source code at
    <a href="https://github.com/Bluebie/sign-search">GitHub</a>.
  </p>
  <p>
    Find Sign indexes copyright data, so the dataset is not open source, but it is intended to be open access for
    non-commercial use. For now, BitTorrent and Hypercore access has been disabled due to performance issues and
    barely any usage. Slow progress is being made refactoring the site to use simple yaml files to store all the
    interesting data. A service is planned to also offer JSON, XML, and CBOR translations of these YAML files.
    When this is finished, the data will be available over a simple http interface. In the mean time, send me
    (@Bluebie on Github or Twitter) a message if you want access, maybe I can sort something out in the mean time.
  </p>
  <p>
    If you want to apply this searching technology to another sign language, you'll need to capture the data for your
    search index, by building some kind of spider program. The easiest way to make this work is to output either YAML
    or JSON in the
  </p>
  <p>
    If you're motivated enough, you could look at the source code for Find Sign and use it's javascript libraries to
    load the search index cbor file, and then use that to load every definition shard file, and then use the definitions
    to load every video. You're certainly welcome to do this, you don't need to ask permission. But if you're going to
    depend on updates from Find Sign, please do contact me, so I can coordinate with you before making breaking changes
    to the search index file formats.
  </p>
</main>

<style>
  :global(*) {
    box-sizing: border-box; /* i just like it better ok? microsoft was right */
  }

  :global(body) {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background-color: var(--base-bg);
    color: var(--base-fg);
  }

  main {
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }

  a {
    color: inherit;
  }
</style>