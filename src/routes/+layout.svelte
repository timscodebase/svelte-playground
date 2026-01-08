<script lang="ts">
  import { Nav } from "$lib";
  import { onMount } from "svelte";
  import { theme } from "$lib/theme.svelte";
  import favicon from "$lib/assets/favicon.svg";
  import "./styles.css";

  const { children } = $props();

  onMount(() => {
    theme.init();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Nav />

{@render children()}
