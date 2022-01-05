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
<div class="video-player">
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
  .video-player {
    display: block;
    background-color: var(--submodule-bg);
    border-radius: 6px;
    width: 250px;
    height: 140px;
    position: absolute;
    overflow: hidden;
    margin-left: -250px;
    margin-top: 7px;

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

  video {
    width: 100%; height: 100%; border-radius: 6px;
  }

  picture {
    width: auto; height: 100%; margin-left: auto; margin-right: auto; display: block;
  }

  button.prev, button.next {
    position: absolute;
    top: 0; bottom: 0; margin: 0;
    width: 32px;
    border: 0 none;
    padding: 0;
    font-size: inherit;
    font-weight: inherit;
    font-family: inherit;
    color: inherit;
    background-color: hsla(var(--hue), var(--module-bg-sat), var(--module-bg-lum), 40%);
    /* backdrop-filter: blur(2px); */
  }

  button.prev { left: 0; border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
  button.next { right: 0; border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
</style>
