<script>
  import SearchInput from './search-input.svelte'
  import { slide } from 'svelte/transition'

  export let logo = '/style/assets/find-sign-logo.svg'
  export let showNavigation = true
  export let query = undefined
  export let formAction = '/search'

  // queryHandler is responsible for search box entrys
  export let queryHandler = (query) => {
    console.log('Unhandled search query:', query)
  }

  export let logoClick = (event) => {
    event.preventDefault()
    query = ''
    queryHandler('')
  }
</script>

<header class={$$props.class}>
  <!-- header logo -->
  <a href={'/#'} on:click={logoClick}><img class=header alt="Home Button" src={logo}></a>

  <!-- search query input bar -->
  <SearchInput bind:query {formAction} {queryHandler}/>

  <!-- nav links to static pages on the site -->
  {#if showNavigation}
    <nav transition:slide>
      <a href=random.html>Random</a>
      <a href=about.html>About</a>
      <a href=technology.html>Technology</a>
      <a href="https://blog.auslan.fyi/">News</a>
    </nav>
  {/if}
</header>

<style>
  header {
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  header > a {
    display: block;
    cursor: pointer;
    width: auto;
    margin-top: 4rem;
    margin-left: auto;
    margin-right: auto;
    padding-bottom: 1.5rem;
  }

  @media (max-width: 500px) {
    header > a {
      margin-top: 13vw;
    }
  }

  img.header {
    display: block;
  }

  nav {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    width: auto;
    padding: 2.5rem 0 2.5rem 0;
    margin: 0 auto 0 auto;
    font-size: 1.2em;
  }

  @media (max-width: 350px) {
    nav { font-size: 1em; }
  }

  @media (max-width: 280px) {
    nav { display: block; }
    nav a { display: block; text-align: center; }
  }

  nav > a {
    color: inherit;
  }
</style>
