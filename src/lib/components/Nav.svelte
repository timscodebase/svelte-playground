<script lang="ts">
  import ThemeToggle from "./ThemeToggle.svelte";
</script>

<nav>
  <div class="links">
    <a href="/">Home</a>
    <a href="/mulipication-tables">Tables</a>
    <a href="/grid-chase">Grid Chase</a>
    <a href="/flash-cards">Sprint</a>
    <a href="/fraction-pizza">Pizza</a>
    <a href="/equation-builder">Builder</a>
  </div>
  <div class="actions">
    <ThemeToggle />
  </div>
</nav>

<style>
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
    margin-bottom: 0;
  }

  .links {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  a {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 500;
    font-family: "Roboto Mono", monospace;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  a:hover {
    color: var(--text-main);
    text-decoration: underline;
    text-decoration-color: var(--accent);
  }
</style>
