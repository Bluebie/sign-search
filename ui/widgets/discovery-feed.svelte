<script>
  import Icon from './icon.svelte'
  import MainBlock from './main-block.svelte'
  import { humane as humaneTime, iso as computerTime } from '../functions/date.mjs'

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
</script>

<MainBlock>
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
</MainBlock>

<style>
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
</style>