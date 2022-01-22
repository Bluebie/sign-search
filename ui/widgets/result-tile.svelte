<script>
  import Carousel from './tiny-media-carousel.svelte'
  import RegionMap from './region-map.svelte'
  import Icon from './icon.svelte'

  export let result = undefined
  export let expand = false

  $: warnings = result ? [...getWarnings(result.tags)] : []

  function * getWarnings (tags) {
    if (tags.includes('invented'))
      yield { text: 'Informal, colloqual sign. Professionals should not use.' }
  }
</script>


<div class={$$props.class} class:result={true} class:placeholder={!result} class:expand={expand}>
  {#if result}
    <Carousel medias={result.media} link={result.link} class=carousel></Carousel>

    {#if ['wa','nt','sa','qld','nsw','act','vic','tas'].some(x => result.tags.includes(x))}
      <RegionMap tags={result.tags} class=map></RegionMap>
    {/if}

    <h2 class=words>
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
      <div class=tags>
        {#each result.tags as tag}{`#${tag} `}{/each}
      </div>
    {/if}

    <div class=body>
      {#if warnings.length > 0}
        <div class=alerts>
          {#each warnings as warning}
            <div class="alert {warning.type}">
              <Icon name={warning.icon || 'alert'}/>
              {warning.text}
            </div>
          {/each}
        </div>
      {/if}
      {result.body || ''}
    </div>
  {/if}
</div>

<style>
  .result {
    background-color: var(--module-bg);
    border-radius: 10px;
    margin-top: 1.1em;
    color: inherit;
    text-decoration: none;
    overflow: hidden;
    padding: 1ex;

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

  .words {
    line-height: 1em;
    margin: 0;
    grid-area: title;
    font-size: 1.3rem;
    font-weight: normal;
    text-transform: capitalize;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .words a {
    text-decoration: none;
    color: inherit;
  }

  .result > :global(.map) {
    grid-area: map;
    width: 2em;
    height: 2em;
    stroke-width: 5px;
  }

  .link {
    grid-area: breadcrumbs;
  }

  .tags {
    grid-area: hashtags;
  }

  .alerts {
    grid-area: alerts;
  }

  .body {
    grid-area: body;
  }

  .result:not(.expand) {
    display: grid;
    grid-template-columns: 250px 1ex auto 32px;
    grid-template-rows: 1.3em 1em 1em auto;
    min-height: 158px;
    grid-template-areas:
      "media gap title map"
      "media gap breadcrumbs map"
      "media gap hashtags hashtags"
      "media gap body body";
  }

  .result.expand {
    display: grid;
    grid-template-columns: auto 32px;
    grid-template-rows: auto 1ex auto auto auto auto;
    grid-template-areas:
      "media media"
      "gap gap"
      "title map"
      "breadcrumbs map"
      "hashtags hashtags"
      "alerts alerts"
      "body body";
  }

  .result :global(.carousel) {
    grid-area: media;
  }

  .link, .tags {
    text-overflow: ellipsis;
    font-size: 80%;
    white-space: nowrap;
    overflow: hidden;
  }

  .link a {
    text-decoration: underline;
    font-style: normal;
    color: inherit;
  }

  /* add forward slashes to nav breadcrumb type links */
  .link a:not(:first-child):before {
    content: "/";
    padding-left: 0.7ex;
    padding-right: 0.7ex;
    display: inline-block; /* removes underline */
  }

  .body {
    --line-height: 1.4em;
    --visible-lines: 4.65;
    text-overflow: ellipsis;
    white-space: pre-line;
    overflow: hidden;
    line-height: var(--line-height);
    font-size: 0.95em;
    max-height: calc(var(--line-height) * var(--visible-lines) - 1rem);
  }

  /* alert notices on search results */
  .result.invented { background-color: var(--alert-bg); }
  .result .alert :first-child {
    vertical-align: -0.2ex;
  }
</style>