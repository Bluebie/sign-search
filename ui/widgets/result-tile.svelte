<script>
  import Carousel from './tiny-media-carousel.svelte'
  import RegionMap from './region-map.svelte'
  import Icon from './icon.svelte'

  export let result = undefined
  const warnings = []
</script>


<div class=result class:placeholder={!result}>
  {#if result}
    <Carousel medias={result.media} link={result.link}></Carousel>

    {#if ['wa','nt','sa','qld','nsw','act','vic','tas'].some(x => result.tags.includes(x))}
      <RegionMap tags={result.tags} class=map></RegionMap>
    {/if}

    <h2 class=keywords>
      <a href={result.link} referrerpolicy=origin rel=external>{result.title || result.keywords.join(', ')}</a>
    </h2>

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

    {#each warnings as warning}
      <div class="alert {warning.type}">
        <Icon name={warning.icon || 'alert'}/>
        {warning.text}
      </div>
    {/each}

    <div class="body">{result.body}</div>
  {/if}
</div>

<style>
  .result {
    background-color: var(--module-bg);
    border-radius: 10px;
    margin-top: 1.1em;
    display: block;
    color: inherit;
    text-decoration: none;
    padding-left: 257px;
    min-height: 156px;
    overflow: hidden;
    animation: result-in var(--fade-duration);

    /* very fancy soon to be out of style custom 'neumorphic' style box */
    box-shadow:
    /* inset highlight and shadow */
    inset 0 -7rem 5em -2em hsla(var(--hue), calc(var(--module-bg-sat) - 5%), calc(var(--module-bg-lum) + 5%), var(--outer-highlight-alpha)),
    inset 0 +7rem 5em -2em hsla(var(--hue), calc(var(--module-bg-sat) + 5%), calc(var(--module-bg-lum) - 3%), var(--outer-shadow-alpha)),
    /* outside drop shadow */
    0.3rem 0.3rem 0.4rem hsla(var(--hue), calc(var(--base-bg-sat) + 5%), calc(var(--base-bg-lum) - 10%), var(--outer-shadow-alpha)),
    0.2rem 0.3rem 0.2rem hsla(var(--hue), calc(var(--base-bg-sat) + 5%), calc(var(--base-bg-lum) - 8%), var(--outer-shadow-alpha)),
    0.1rem 0.1rem 0.1rem hsla(var(--hue), calc(var(--base-bg-sat) + 5%), calc(var(--base-bg-lum) - 6%), var(--outer-shadow-alpha)),
    /* outside top highlight */
    -0.3rem -0.3rem 0.4rem hsla(var(--hue), calc(var(--base-bg-sat) - 5%), calc(var(--base-bg-lum) + 6%), var(--outer-highlight-alpha)),
    -0.2rem -0.2rem 0.2rem hsla(var(--hue), calc(var(--base-bg-sat) - 5%), calc(var(--base-bg-lum) + 4%), var(--outer-highlight-alpha)),
    -0.1rem -0.1rem 0.1rem hsla(var(--hue), calc(var(--base-bg-sat) - 5%), calc(var(--base-bg-lum) + 2%), var(--outer-highlight-alpha))
    ;
  }

  @keyframes result-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .result .video-player {
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

  .result > *:not(:first-child) {
    display: block;
    padding-left: 0.7rem;
    margin-bottom: 0.1rem;
    padding-right: 0.5rem;
  }

  .result .keywords {
    margin-top: 0.3rem;
    margin-bottom: 0rem;
    font-size: 1.3rem;
    font-weight: normal;
    text-transform: capitalize;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .result .keywords a {
    text-decoration: none;
    color: inherit;
  }
  .result > :global(.map) {
    float: right;
    width: 41px;
    height: 32px;
    margin-top: 0.5rem;
  }

  .result .link,
  .result .tags {
    text-overflow: ellipsis;
    font-size: 80%;
    white-space: nowrap;
    overflow: hidden;
  }

  .result .link a {
    text-decoration: underline;
    font-style: normal;
    color: inherit;
  }

  /* add forward slashes to nav breadcrumb type links */
  .result .link a:not(:first-child):before {
    content: "/";
    padding-left: 0.7ex;
    padding-right: 0.7ex;
    display: inline-block; /* removes underline */
  }

  .result .body {
    --line-height: 1.4em;
    --visible-lines: 4.65;
    text-overflow: ellipsis;
    white-space: pre-line;
    overflow: hidden;
    line-height: var(--line-height);
    font-size: 0.95em;
    max-height: calc(var(--line-height) * var(--visible-lines) - 1rem);
  }
  .result .alert + .body {
    --visible-lines: 5;
  }

  /* alert notices on search results */
  .result.invented { background-color: var(--alert-bg); }
  .result .alert :first-child {
    vertical-align: -0.2ex;
  }
</style>