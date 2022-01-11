<script>
  export let name
</script>

<svg class={`icon-${name}`} aria-hidden="true">
  <use href={`ui/assets/icomoon/symbol-defs.svg#icon-${name}`}></use>
</svg>

<style>
  svg {
    fill: var(--base-fg);
    width: 1em; height: 1em;
  }
</style>