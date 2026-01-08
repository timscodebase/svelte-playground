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
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    width: 100%;
    max-width: 1200px;
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
    display: flex;
    flex-direction: column;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    border-color: #52525b;
  }

  .card-bg {
    height: 6px;
    width: 100%;
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
  }

  /* Tailwind-ish Gradient Stops */
  .from-blue-500 {
    --tw-gradient-stops: #3b82f6, #22d3ee;
  }
  .from-yellow-500 {
    --tw-gradient-stops: #eab308, #f97316;
  }
  .from-emerald-500 {
    --tw-gradient-stops: #10b981, #2dd4bf;
  }
  .from-red-500 {
    --tw-gradient-stops: #ef4444, #eab308;
  }
  .from-indigo-500 {
    --tw-gradient-stops: #6366f1, #a855f7;
  }
  .from-pink-500 {
    --tw-gradient-stops: #ec4899, #f43f5e;
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
    margin-top: auto;
  }
</style>
