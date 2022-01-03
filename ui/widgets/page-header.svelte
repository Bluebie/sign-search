<script>
  import Icon from './icon.svelte'
  const { signSearch } = require('../../package.json')

  export let logo = '/style/assets/find-sign-logo.svg'
  export let showNavigation = true
  export let query = ''
</script>

<!-- header logo -->
<a href={'/#'}><img class=header alt="Home Button" src={logo}></a>

<!-- search query input bar -->
<form id=search-form role=search autocomplete=off action={'/search'} method=GET>
  <Icon name=search />
  <input id=search-box autocomplete=off autocapitalize=none aria-label="Enter search query here." name=query value={query}>
</form>

<!-- nav links to static pages on the site -->
{#if showNavigation}
  <nav id=nav-links>
    {#each signSearch.navLinks as [title, path]}
      <a href={path}>{title}</a>
    {/each}
  </nav>
{/if}

<style>
  img.header {
    margin-top: 4em;
    width: 500px;
    display: block;
    margin-left: auto;
    margin-right: auto;
    cursor: pointer;
  }

  form#search-form {
    font-size: 1.6em;
    width: 500px;
    margin: 0 auto 0 auto;
  }

  /* magnifing glass symbol in search form */
  :global(form#search-form .icon-search) {
    position: absolute;
    width: 1em;
    height: 1em;
    margin-left: 0.65em;
    margin-top: 0.65em;
  }

  input#search-box {
    display: block;
    font-family: inherit;
    font-size: inherit;
    width: 100%;
    padding: 0.4em 0.4em 0.4em 1.8em;
    border-radius: 1.8rem;
    /* background-color: var(--module-bg); */
    caret-color: var(--base-fg);
    color: inherit;
    border: 0 none;
    margin: 1.5rem auto 1.5rem auto;
    outline: 0 none;

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

  #nav-links {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    width: 500px;
    margin: 2.5rem auto 2.5rem auto;
    font-size: 1.2em;
  }

  #nav-links a {
    color: inherit;
  }
</style>
