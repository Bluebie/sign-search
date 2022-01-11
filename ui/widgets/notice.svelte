<script>
  import Icon from './icon.svelte'

  export let icon
</script>

<div>
  {#if icon}
    <Icon name={icon}/>
  {/if}
  <slot/>
</div>

<style>
  div {
    background-color: var(--alert-bg);
    color: var(--module-fg);
    width: max-content;
    margin-left: auto;
    margin-right: auto;
    padding: 1.5em 2em;
    border-radius: 2ex;
  }
</style>