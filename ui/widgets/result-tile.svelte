<script>
  const Carousel = require('./tiny-media-carousel.svelte')
  const RegionMap = require('./region-map.svelte')
  let classList = []
  let warnings = {}
  let result

  $: classes = new Set([...classList, ...fetched ? getWarnings().map(x => x.type)])

  function getWarnings() {
    const matches = Object.keys(triggers).filter(tag => this.result.tags.includes(tag))
    return [...matches.map(tag => triggers[tag]), ...this.forcedWarnings]
  }
</script>

{#await fetch}
  <!-- placeholder -->
  <div class="${[...classes, 'placeholder'].join(' ')}" aria-hidden="true">
  </div>
{:then _}
  <!-- populated -->
  <div class={[...classes].join(' ')}>
    <Carousel medias={result.media} link={result.link}></Carousel>
    <RegionMap tags={result.tags}></RegionMap>
    <h2 class="keywords"><a href={result.link} referrerpolicy="origin" rel="external">{result.title || result.keywords.join(', ')}</a></h2>
    <cite class="link">
      {#if result.nav && result.nav.length > 0}
        {#each result.nav as [name, url]}
          <a href={url} referrerpolicy="origin" rel="external">{name}</a>
        {/each}
      {:else}
        <a href={result.link}>{result.link}</a>
      {/if}
    </cite>
    <div class="tags">${this.result.tags.map(x => `#${x}`).join(' ')}</div>
    ${this.getWarnings().map(warning => html`<div class="alert ${warning.type}">${icon(warning.icon || 'alert')} ${warning.text}</div>`)}
    <div class="body">${this.result.body}</div>
  </div>`
{:catch error}

{/await}

<style>
  </style>