<script lang="ts">
  import { theme, type Theme } from "$lib/theme.svelte";

  function cycleTheme() {
    const modes: Theme[] = ["light", "dark", "system"];
    const nextIndex = (modes.indexOf(theme.current) + 1) % modes.length;
    theme.set(modes[nextIndex]);
  }
</script>

<button onclick={cycleTheme} class="theme-btn" title="Current: {theme.current}">
  {#if theme.current === "light"}
    ☀️
  {:else if theme.current === "dark"}
    🌙
  {:else}
    💻
  {/if}
</button>

<style>
  .theme-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-main);
    padding: 0.5rem;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .theme-btn:hover {
    background: var(--bg-panel-hover);
  }
</style>
