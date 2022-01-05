<!-- builds a map svg image of the country, representing which regions are specified for this sign -->
<script>
  const regions = ['wa', 'nt', 'sa', 'qld', 'nsw', 'act', 'vic', 'tas']
  const url = 'style/assets/auslan-map.svg'
  export let tags = []
  export let editable = false

  // if editable, toggle regions when they're clicked
  function click (event) {
    const clickRegion = event.currentTarget.dataset.region
    console.log(`user clicked region ${clickRegion}`)
    if (editable) {
      // toggle the tag
      if (tags.includes(clickRegion)) tags = tags.filter(x => x != clickRegion)
      else tags = [tags, ...clickRegion]
    }
  }
</script>

<svg class:editable class={$$props.class}>
  {#each regions as region}
    <use href={`${url}#${region}`} class:active={tags.includes(region)} on:click={click} data-region={region}></use>
  {/each}
</svg>

<style>
  svg use {
    fill: hsla(var(--hue), var(--base-fg-sat), var(--base-fg-lum), 0.25);
    stroke: var(--module-bg);
    stroke-width: 10px;
  }

  svg use.active {
    fill: var(--base-fg);
  }

  svg.editable use {
    cursor: pointer;
    pointer-events: fill;
  }
</style>