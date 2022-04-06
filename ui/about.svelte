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

  export let hashtags

  function searchURL (query) {
    return `/#${new URLSearchParams({ query, page: 0 })}`
  }
</script>

<PageHeader/>

<main>
  <h1>What is this?</h1>
  <p>
    This website is a search engine. It looks at other websites that have Auslan sign videos, and creates
    search results including videos from other websites. This search system uses Artificial Intelligence
    research to understand what words and signs mean, and find signs with similar meaning.
  </p>
  <p>
    Try any English word or phrase. This website will try to understand what the word means, and find sign
    videos with similar meaning. It's different to how other Auslan search systems work. You don’t need
    to type the same words the authors of sign videos used in their English descriptions. If the meaning is
    similar, it should find it!
  </p>
  <h1>Who is this for?</h1>
  <p>
    I think it’s useful for two people:
  </p>
  <ol>
    <li>Person learning Auslan: they can learn more vocabulary</li>
    <li>Person who doesn’t know much English: They can look up an English word, and see roughly what
      it might mean in Auslan, even if no sign for exactly that idea exists in the websites yet</li>
  </ol>
  <h1>Who made it?</h1>
  <p>
    My name is Phoenix. I’m Hard of Hearing, and I love Auslan! English is my first language, but Auslan
    is my favourite language. I created Find Sign to help make it easier for people learning this beautiful
    language, and launched this website in 2019, after 6 months building it together with input from many
    Deaf friends and Auslan students.
  </p>
  <p>
    I want to help spread Auslan to people who cannot learn it. Maybe they are too poor to come to Deaf
    socials or go to Tafe, or maybe they live far away and cannot travel. I think a lot of people can live
    better lives by learning some Auslan, and there are lots of ways to help spread information and grow
    our community! Even if they only learn vocabulary and use signed english style, it can still help
    improve their life!
  </p>
  <h1>How to use it best?</h1>
  <p>
    The simplest thing is to type some words in to the search box, and see signs from all around Australia.
    But Find Sign can do some more advanced searches:
  </p>
  <p>
    #hashtags allow you to limit the search results, so only results with the tags you asked for appear.
    Every search result has a list of #hashtags under the web link. You can put any of these in to the
    search box, and then your results will only be ones which include every hashtag you searched for.
    For example, you can search for "<a href={searchURL('#asphyxia')}>#asphyxia</a>" to only see results
    from Asphyxia's youtube series, or "<a href={searchURL('#qld')}>#qld</a>" to only see results which
    are listed as being used in Queensland. You can also search for a hashtag, with a minus in front of
    it, like "<a href={searchURL('-#toddslan')}>-#toddslan</a>" to show results which <em>do not include</em>
    #toddslan. This can be very powerful with Auslan Signbank searches. You can search for
    "<a href={searchURL('#signbank #phonology.symmetrical')}>#signbank #phonology.symmetrical</a>" to find
    results where both hands do the same thing.
  </p>
  <h1>What are all the #hashtags?</h1>
  <ul id="hashtags-list">
    {#each hashtags as { hashtag, count }}
      {#if count > 1}
        <li><a href={searchURL(`#${hashtag}`)}>#{hashtag}</a> <span>({count})</span></li>
      {/if}
    {/each}
  </ul>
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

  ul#hashtags-list li > span {
    opacity: 0.5;
    font-size: 70%;
  }
</style>