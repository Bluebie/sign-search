<script>
  const Icon = require('./icon.svelte')
  let length = 1
  let selected = 0
  let toURL = (pagenum) => `?page=${pagenum}`
  let toLabel = (pagenum) => `${pagenum + 1}`
  let toAriaLabel = (pagenum) => `Go to page ${pagenum + 1}`
</script>

<nav id="pagination">
  {#each { length } as _, page}
    <a href={toURL(page)} aria-label={toAriaLabel(page)} aria-current={(page === selected) && 'page'}>
      <slot page>
        <Icon name={page + 1}/>
      </slot>
    </a>
  {/each}
</nav>

<style>
  nav {
    margin: 2em 0 2em 0;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  nav a {
    display: inline-block;
    font-size: 2.6rem;
    padding: 0;
    outline: 0 none;
    width: 60px; height: 60px;
    text-decoration: none;
    text-align: center;
  }

  nav a[aria-current="page"] {
    background-color: var(--module-bg);
    border-radius: 30px;
    cursor: default;
    box-shadow:
      inset +0.1rem +0.15rem +0.4rem +0.05rem hsla(var(--hue), calc(var(--module-bg-sat) + 3%), calc(var(--module-bg-lum) - 10%), 100%),
      inset +0.2rem +0.25rem +0.6rem +0.20rem hsla(var(--hue), calc(var(--module-bg-sat) + 3%), calc(var(--module-bg-lum) - 5%), 100%);
  }

  nav a svg {
    width: 2.6rem;
    height: 2.6rem;
    vertical-align: -0.2em;
  }
</style>
