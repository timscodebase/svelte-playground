<script lang="ts">
  import { fade } from "svelte/transition";

  const apps = [
    {
      title: "Times Tables",
      desc: "Master your multiplication with this interactive grid challenge.",
      href: "/mulipication-tables", // Note: Keeping your existing folder name
      color: "from-blue-500 to-cyan-400",
      icon: "X",
    },
    {
      title: "Arithmetic Sprint",
      desc: "Race against the clock to solve addition, subtraction, and division problems.",
      href: "/flash-cards",
      color: "from-yellow-500 to-orange-500",
      icon: "⚡",
    },
  ];
</script>

<div class="dashboard" in:fade>
  <header>
    <h1>Math<span class="highlight">Playground</span></h1>
    <p class="subtitle">Select a tool to begin training</p>
  </header>

  <div class="grid">
    {#each apps as app}
      <a href={app.href} class="card">
        <div class="card-bg {app.color}"></div>
        <div class="content">
          <div class="icon">{app.icon}</div>
          <h2>{app.title}</h2>
          <p>{app.desc}</p>
          <span class="link-text">Open Tool &rarr;</span>
        </div>
      </a>
    {/each}
  </div>
</div>

<style>
  :root {
    --bg-color: #18181b;
    --card-surface: #27272a;
    --text-primary: #f4f4f5;
    --text-secondary: #a1a1aa;
  }

  .dashboard {
    min-height: 100vh;
    padding: 4rem 2rem;
    background-color: var(--bg-color);
    color: var(--text-primary);
    font-family: "Roboto Mono", monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  header {
    text-align: center;
    margin-bottom: 4rem;
  }

  h1 {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    letter-spacing: -1px;
  }

  .highlight {
    color: #facc15;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    width: 100%;
    max-width: 1000px;
  }

  .card {
    position: relative;
    background: var(--card-surface);
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    border: 1px solid #3f3f46;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    height: 100%;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    border-color: #52525b;
  }

  /* Gradient Top Bar */
  .card-bg {
    height: 6px;
    width: 100%;
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
  }

  /* Utility classes for gradients (mimicking Tailwind classes for pure CSS) */
  .from-blue-500 {
    --tw-gradient-stops: #3b82f6, #22d3ee;
  }
  .from-yellow-500 {
    --tw-gradient-stops: #eab308, #f97316;
  }
  .from-emerald-500 {
    --tw-gradient-stops: #10b981, #2dd4bf;
  }

  .content {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    height: calc(100% - 6px);
  }

  .icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
    font-weight: bold;
  }

  p {
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 2rem;
    flex-grow: 1;
  }

  .link-text {
    font-weight: bold;
    color: #facc15;
    text-transform: uppercase;
    font-size: 0.9rem;
    letter-spacing: 1px;
  }
</style>
