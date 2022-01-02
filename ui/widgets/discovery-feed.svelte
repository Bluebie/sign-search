<script>
  import Icon from './icon.svelte'
  import { format } from 'date-fns'
  const spiderConfigs = require('../../tools/spiders/configs.json')

  export let feed = []

  // group entries by day, with humane headings
  function dateGrouped (entries) {
    const grouped = []
    for (const entry of entries) {
      const humane = humaneTime(entry.timestamp)
      if (grouped.length === 0 || grouped[0].humane !== humane) {
        grouped.unshift({
          humane,
          computer: computerTime(entry.timestamp),
          entries: [entry]
        })
      } else {
        grouped[0].entries.unshift(entry)
      }
    }
    return grouped
  }

  function humaneTime (timestamp) {
    return format(new Date(timestamp), 'EEEE, do LLLL yyyy')
  }

  function computerTime (timestamp) {
    return (new Date(timestamp)).toISOString()
  }
</script>

<main>
  <div class="h-feed">
    <a href={'/feeds/discovery.rss'} class=icon-feed title="RSS Feed"><Icon name=feed/></a>
    {#each dateGrouped(feed) as { humane, computer, entries }}
      <h2><time datetime={computer}>{humane}</time></h2>
      {#each entries as entry}
        <div class="discovery-link h-entry">
          <time datetime={computer} class="dt-published entry-timestamp">{humane}</time>
          <a class="provider-link p-author h-card" href={entry.authorLink}>{entry.authorName}</a>
          {entry.verb || 'documented'}
          <a href={entry.link} class="entry-link p-name u-url">{entry.title}</a>
        </div>
      {/each}
    {/each}
  </div>
</main>

<style>
  .h-feed {
    width: 500px;
    min-height: 300px;
    margin: 0 auto 3em auto;
    padding: 0.5rem 0.5rem 0.5rem 0.9rem;
    line-height: 1.35em;
    background-color: var(--module-bg);
    border-radius: 1rem;
    border: 3px solid var(--module-bg);
    overflow: hidden;
    /* very fancy soon to be out of style custom 'neumorphic' style box */
    box-shadow:
    /* outside drop shadow */
    0.3rem 0.6rem 0.8rem hsla(var(--hue), calc(var(--base-bg-sat) + 5%), calc(var(--base-bg-lum) - 6%), var(--outer-shadow-alpha)),
    0.3rem 0.5rem 1.0rem hsla(var(--hue), calc(var(--base-bg-sat) + 5%), calc(var(--base-bg-lum) - 4%), var(--outer-shadow-alpha)),
    0.3rem 0.4rem 1.2rem hsla(var(--hue), calc(var(--base-bg-sat) + 5%), calc(var(--base-bg-lum) - 2%), var(--outer-shadow-alpha)),
    /* outside top highlight */
    -0.3rem -0.6rem 0.8rem hsla(var(--hue), calc(var(--base-bg-sat) - 5%), calc(var(--base-bg-lum) + 6%), var(--outer-highlight-alpha)),
    -0.3rem -0.5rem 1.0rem hsla(var(--hue), calc(var(--base-bg-sat) - 5%), calc(var(--base-bg-lum) + 4%), var(--outer-highlight-alpha)),
    -0.3rem -0.4rem 1.2rem hsla(var(--hue), calc(var(--base-bg-sat) - 5%), calc(var(--base-bg-lum) + 2%), var(--outer-highlight-alpha))
    ;
  }

  a.icon-feed {
    display: block;
    width: 1em; height: 1em;
    float: right;
  }

  h2, div.discovery-link {
    font-size: 1em;
    margin: 0;
    padding: 0;
  }

  div.discovery-link {
    display: list-item;
    list-style-position: inside;
    list-style-type: square;
    padding-left: 0.5em;
  }

  time.entry-timestamp {
    display: none;
  }

  a {
    color: inherit;
  }
</style>