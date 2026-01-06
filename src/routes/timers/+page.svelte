<script lang="ts">
  import { Timer } from "$lib";
</script>

<h1>Svelte 5 Timer Playground</h1>

<div class="grid">
  <Timer duration={60} />

  <Timer duration={30} countDirection="up" />
</div>

<style>
  .grid {
    display: grid;
    justify-content: center;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    margin-top: 2rem;
  }
</style>
