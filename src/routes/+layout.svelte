<script lang="ts">
  import { Nav } from "$lib";
  import favicon from "$lib/assets/favicon.svg";
  import "./styles.css";

  const { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Nav />

{@render children()}
