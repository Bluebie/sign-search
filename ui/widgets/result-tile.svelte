<script>
  const Carousel = require('./tiny-media-carousel.svelte')
  const RegionMap = require('./region-map.svelte')
  export let classList = []
  export let warnings = {}
  export let result = undefined

  // $: classes = new Set([...classList, ...fetched ? getWarnings().map(x => x.type)])
  let classes = []

  function getWarnings() {
    const matches = Object.keys(triggers).filter(tag => this.result.tags.includes(tag))
    return [...matches.map(tag => triggers[tag]), ...this.forcedWarnings]
  }
</script>

{#if result}
  <!-- populated -->
  <div class={[...classes].join(' ')}>
    <Carousel medias={result.media} link={result.link}></Carousel>
    <RegionMap tags={result.tags}></RegionMap>
    <h2 class=keywords><a href={result.link} referrerpolicy=origin rel=external>{result.title || result.keywords.join(', ')}</a></h2>
    <cite class=link>
      {#if result.nav && result.nav.length > 0}
        {#each result.nav as [name, url]}
          <a href={url} referrerpolicy=origin rel=external>{name}</a>
        {/each}
      {:else}
        <a href={result.link}>{result.link}</a>
      {/if}
    </cite>

    {#if result.tags && result.tags.length > 0}
      <div class="tags">
        {#each result.tags as tag}
          #{tag}
        {/each}
      </div>
    {/if}
    <!-- ${this.getWarnings().map(warning => html`<div class="alert ${warning.type}">${icon(warning.icon || 'alert')} ${warning.text}</div>`)} -->
    <div class="body">{this.result.body}</div>
  </div>`
{:else}
  <!-- placeholder -->
  <div class={[...classes, 'placeholder'].join(' ')} aria-hidden=true></div>
{/if}

<style>
</style>