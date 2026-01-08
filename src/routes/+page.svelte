<script lang="ts">
  import { fade } from "svelte/transition";

  const apps = [
    {
      title: "Times Tables",
      desc: "Master your multiplication with this interactive grid challenge.",
      href: "/mulipication-tables",
      color: "from-blue-500 to-cyan-400",
      icon: "✖️",
    },
    {
      title: "Grid Chase",
      desc: "Reverse multiplication! Find all grid cells that match the target.",
      href: "/grid-chase",
      color: "from-indigo-500 to-purple-500",
      icon: "🔍",
    },
    {
      title: "Arithmetic Sprint",
      desc: "Race against the clock to solve math problems.",
      href: "/flash-cards",
      color: "from-yellow-500 to-orange-500",
      icon: "⚡",
    },
    {
      title: "Equation Builder",
      desc: "Drag and drop puzzles. Balance the equation.",
      href: "/equation-builder",
      color: "from-pink-500 to-rose-500",
      icon: "🧩",
    },
    {
      title: "Pizza Slicer",
      desc: "Visual fractions game. Slice and serve the correct portion.",
      href: "/fraction-pizza",
      color: "from-red-500 to-yellow-500",
      icon: "🍕",
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
    --blue-500: oklch(65.2% 0.16 248);
    --cyan-400: oklch(80% 0.12 195);
    --yellow-500: oklch(75% 0.15 85);
    --orange-500: oklch(70% 0.18 50);
    --emerald-500: oklch(65% 0.15 150);
    --teal-400: oklch(75% 0.1 165);
    --red-500: oklch(65% 0.2 25);
    --indigo-500: oklch(60% 0.15 260);
    --purple-500: oklch(60% 0.18 280);
    --pink-500: oklch(65% 0.2 330);
    --rose-500: oklch(65% 0.22 10);
  }
  .dashboard {
    min-height: 100vh;
    padding: 4rem 2rem;
    background-color: var(--bg-app);
    color: var(--text-main);
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
    color: var(--accent);
  }
  .subtitle {
    color: var(--text-muted);
    font-size: 1.1rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    width: 100%;
    max-width: 1200px;
  }
  .card {
    position: relative;
    background: var(--bg-panel);
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--border);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border-color: var(--text-muted);
  }
  .card-bg {
    height: 6px;
    width: 100%;
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
  }
  .from-blue-500 {
    --tw-gradient-stops: var(--blue-500), var(--cyan-400);
  }
  .from-yellow-500 {
    --tw-gradient-stops: var(--yellow-500), var(--orange-500);
  }
  .from-emerald-500 {
    --tw-gradient-stops: var(--emerald-500), var(--teal-400);
  }
  .from-red-500 {
    --tw-gradient-stops: var(--red-500), var(--yellow-500);
  }
  .from-indigo-500 {
    --tw-gradient-stops: var(--indigo-500), var(--purple-500);
  }
  .from-pink-500 {
    --tw-gradient-stops: var(--pink-500), var(--rose-500);
  }
  .content {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
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
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 2rem;
    flex-grow: 1;
  }
  .link-text {
    font-weight: bold;
    color: var(--accent);
    text-transform: uppercase;
    font-size: 0.9rem;
    letter-spacing: 1px;
    margin-top: auto;
  }
</style>
