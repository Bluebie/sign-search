<script>
  export let medias = []
  export let selected = 0
  export let link = undefined

  $: media = medias[selected]
  // 'image' or 'video'
  $: type = media[0].type.split('/')[0]
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<!-- these videos have no audio to caption -->
<div class={$$props.class}>
  <a href={link} referrerpolicy=origin rel=external>
    {#key media}
      {#if type === 'video'}
        <video muted preload autoplay loop playsinline>
          {#each media as source}<source src={source.src} type={source.type}>{/each}
        </video>
      {:else if type === 'image'}
        <picture>
          {#each media as source}<source src={source.src} type={source.type}>{/each}
        </picture>
      {/if}
    {/key}
  </a>

  {#if selected > 0}
    <button class=prev aria-label="Previous Video" on:click={() => selected -= 1}>❮</button>
  {/if}
  {#if selected < medias.length - 1}
    <button class=next aria-label="Next Video" on:click={() => selected += 1}>❯</button>
  {/if}
</div>

<style>
  div {
    display: grid;
    grid-template-columns: 32px auto 32px;
    grid-template-rows: auto;
    background-color: var(--submodule-bg);
    border-radius: 6px;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;

    /* very fancy soon to be out of style custom 'neumorphic' style box */
    box-shadow:
      /* inset highlight and shadow */
      inset 0 -7rem 5em -2em hsla(var(--hue), calc(var(--module-bg-sat) - 5%), calc(var(--module-bg-lum) + 5%), var(--outer-highlight-alpha)),
      inset 0 +7rem 5em -2em hsla(var(--hue), calc(var(--module-bg-sat) + 5%), calc(var(--module-bg-lum) - 3%), var(--outer-shadow-alpha)),
      /* outside drop shadow */
      0.3rem 0.3rem 0.4rem hsla(var(--hue), calc(var(--module-bg-sat) + 5%), calc(var(--module-bg-lum) - 10%), var(--outer-shadow-alpha)),
      0.2rem 0.3rem 0.2rem hsla(var(--hue), calc(var(--module-bg-sat) + 5%), calc(var(--module-bg-lum) - 8%), var(--outer-shadow-alpha)),
      0.1rem 0.1rem 0.1rem hsla(var(--hue), calc(var(--module-bg-sat) + 5%), calc(var(--module-bg-lum) - 6%), var(--outer-shadow-alpha)),
      /* outside top highlight */
      -0.3rem -0.3rem 0.4rem hsla(var(--hue), calc(var(--module-bg-sat) - 5%), calc(var(--module-bg-lum) + 6%), var(--outer-highlight-alpha)),
      -0.2rem -0.2rem 0.2rem hsla(var(--hue), calc(var(--module-bg-sat) - 5%), calc(var(--module-bg-lum) + 4%), var(--outer-highlight-alpha)),
      -0.1rem -0.1rem 0.1rem hsla(var(--hue), calc(var(--module-bg-sat) - 5%), calc(var(--module-bg-lum) + 2%), var(--outer-highlight-alpha))
    ;
  }

  div > a {
    grid-row: 1;
    grid-column: 1 / 4;
    overflow: hidden;
  }

  video, picture {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 6px;
    z-index: 5;
  }

  button, button {
    grid-row: 1;
    z-index: 10;
    border: 0 none;
    padding: 0;
    font-size: inherit;
    font-weight: inherit;
    font-family: inherit;
    color: inherit;
    background-color: hsla(var(--hue), var(--module-bg-sat), var(--module-bg-lum), 40%);
    /* backdrop-filter: blur(2px); */
  }

  button.prev {
    grid-column: 1;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  button.next {
    grid-column: 3;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
</style>
