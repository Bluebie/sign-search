<script>
  import Icon from './icon.svelte'
  export let formAction = '/search'
  export let method = 'GET'
  export let queryHandler = undefined
  export let query
  export let input

  $: console.log(input)

  function onSearch (event) {
    if (queryHandler) {
      event.preventDefault()
      queryHandler(query)
    }
  }
</script>

<form class={$$props.class} role=search autocomplete=off action={formAction} {method} on:submit={onSearch} on:click={() => input.focus()}>
  <Icon name=search/>
  <input bind:this={input} autocomplete=off autocapitalize=none aria-label="Enter search query here." name=query bind:value={query}>
</form>

<style>
  form {
    --square: calc(3.6rem - 6px);
    display: grid;
    grid-template-columns: var(--square) auto;
    grid-template-rows: var(--square);
    grid-auto-columns: var(--square);
    align-items: center;
    justify-items: center;

    font-size: 1.6em;
    margin: 0 auto 0 auto;

    border-radius: 1.8rem;
    background-image: var(--noise-texture);
    background-color: var(--module-bg);
    background-blend-mode: multiply;
    border: 3px solid var(--module-bg);
    /* very fancy soon to be out of style custom 'neumorphic' style box */
    box-shadow:
      /* inset shadow */
      inset 0.35rem 0.3rem 0.6rem -0.3rem hsla(var(--hue), calc(var(--module-bg-sat) + 4%), calc(var(--module-bg-lum) - 8%), 100%),
      inset 0.30rem 0.4rem 0.7rem -0.3rem hsla(var(--hue), calc(var(--module-bg-sat) + 4%), calc(var(--module-bg-lum) - 8%), 100%),
      inset 0.25rem 0.5rem 0.8rem -0.3rem hsla(var(--hue), calc(var(--module-bg-sat) + 4%), calc(var(--module-bg-lum) - 8%), 100%),
      inset 0.05rem 10rem  10rem   0rem   hsla(var(--hue), calc(var(--module-bg-sat) + 4%), calc(var(--module-bg-lum) - 8%), var(--outer-shadow-alpha)),
      /* inset highlight */
      inset -0.35rem -0.3rem 0.6rem -0.3rem hsla(var(--hue), calc(var(--module-bg-sat) - 2%), calc(var(--module-bg-lum) + 4%), 100%),
      inset -0.30rem -0.4rem 0.7rem -0.3rem hsla(var(--hue), calc(var(--module-bg-sat) - 2%), calc(var(--module-bg-lum) + 4%), 100%),
      inset -0.25rem -0.5rem 0.8rem -0.3rem hsla(var(--hue), calc(var(--module-bg-sat) - 2%), calc(var(--module-bg-lum) + 4%), 100%),
      inset -0.05rem -10rem  10rem   0rem   hsla(var(--hue), calc(var(--module-bg-sat) - 2%), calc(var(--module-bg-lum) + 4%), var(--outer-highlight-alpha)),
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

  /* magnifing glass symbol in search form */
  form :global(.icon-search) {
    display: block;
    width: 1em;
    height: 1em;
    grid-column: 1;
  }

  input {
    display: block;
    grid-column: 2;
    font-family: inherit;
    font-size: inherit;
    caret-color: var(--base-fg);
    background-color: transparent;
    color: inherit;
    border: 0 none;
    outline: 0 none;
    width: 100%;
    height: 100%;
  }
</style>