<!-- builds a map svg image of the country, representing which regions are specified for this sign -->
<script>
  const regions = ['wa', 'nt', 'sa', 'qld', 'nsw', 'vic', 'tas']
  const url = 'ui/assets/auslan-map.svg'
  export let tags = []
  export let width = '100%'
  export let height = '100%'
  export let editable = false

  // if editable, toggle regions when they're clicked
  function click (clickRegion) {
    if (editable) {
      // toggle the tag
      if (tags.includes(clickRegion)) tags = tags.filter(x => x != clickRegion)
      else tags = [...tags, clickRegion]

      // sort the tags list to match the canonical ordering
      tags = regions.filter(x => tags.includes(x))
    }
  }
</script>

<svg class:editable class={$$props.class} viewBox="0 0 512 480" {width} {height} style={$$props.style}>
  {#each regions as region}
    <use href={`${url}#${region}`} class:active={tags.includes(region)} on:click={() => click(region)}/>
  {/each}
</svg>

<style>
  svg {
    fill: hsla(var(--hue), var(--base-fg-sat), var(--base-fg-lum), 0.25);
    stroke: var(--module-bg);
    stroke-width: 2px;
  }

  svg use.active {
    fill: var(--base-fg);
  }

  svg.editable use {
    cursor: pointer;
    pointer-events: fill;
  }
</style>