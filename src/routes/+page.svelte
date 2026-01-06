<script lang="ts">
  import { Counter } from "$lib";
</script>

<h1>Svelte 5 Timer Playground</h1>

<div class="grid">
  <Counter duration={60} />

  <Counter duration={30} countDirection="up" />
</div>

<style>
  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    margin-top: 2rem;
  }
</style>
