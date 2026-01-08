<script lang="ts">
  import { onMount } from "svelte";
  import { scale } from "svelte/transition";
  import confetti from "canvas-confetti";
  import { playSound } from "$lib";

  // --- Configuration ---
  const LEVELS = { Easy: 5, Medium: 8, Hard: 12 } as const;
  type Level = keyof typeof LEVELS;

  // --- State ---
  let currentLevel = $state<Level>("Medium");
  let size = $derived(LEVELS[currentLevel]);
  let targetNumber = $state(0);
  let foundCount = $state(0);
  let score = $state(0);
  let streak = $state(0);

  // Track which cells are currently revealed/found
  let foundCells = $state(new Set<string>());
  // Derived total occurrences of the target in the current grid
  let totalOccurrences = $state(0);

  // Grid for rendering
  let grid = $derived.by(() => {
    const g = [];
    for (let r = 1; r <= size; r++) {
      let row = [];
      for (let c = 1; c <= size; c++) {
        row.push(r * c);
      }
      g.push(row);
    }
    return g;
  });

  function generateRound() {
    foundCells = new Set();
    foundCount = 0;
    // Pick a random number that actually exists in the grid (product of two random numbers)
    const r = Math.floor(Math.random() * size) + 1;
    const c = Math.floor(Math.random() * size) + 1;
    targetNumber = r * c;

    // Calculate how many times this number appears
    let count = 0;
    for (let i = 1; i <= size; i++) {
      for (let j = 1; j <= size; j++) {
        if (i * j === targetNumber) count++;
      }
    }
    totalOccurrences = count;
  }

  function handleCellClick(r: number, c: number, val: number) {
    const key = `${r},${c}`;
    if (foundCells.has(key)) return;

    if (val === targetNumber) {
      playSound("pop");
      foundCells.add(key);
      foundCells = new Set(foundCells);
      foundCount++;
      score += 10;
      if (foundCount === totalOccurrences) {
        playSound("win");
        streak++;
        confetti({ origin: { y: 0.6 }, particleCount: 50 });
        setTimeout(generateRound, 1500);
      }
    } else {
      playSound("wrong");
      streak = 0;
      score = Math.max(0, score - 5);
    }
  }

  function setLevel(l: Level) {
    currentLevel = l;
    score = 0;
    streak = 0;
    generateRound();
  }

  onMount(() => {
    generateRound();
  });
</script>

<div class="page-layout">
  <aside class="sidebar">
    <h2>How to Play</h2>
    <ul>
      <li>Look at the <strong>Find</strong> number in the target box.</li>
      <li>Click every cell in the grid that equals that number.</li>
      <li>
        For example, if the target is <strong>12</strong>, find cells like
        <strong>3x4</strong>, <strong>2x6</strong>, etc.
      </li>
      <li>Find them all to advance!</li>
    </ul>
  </aside>

  <div class="container">
    <div class="header">
      <h1>Grid Chase</h1>
      <div class="controls">
        {#each Object.keys(LEVELS) as level}
          <button
            class:active={currentLevel === level}
            onclick={() => setLevel(level as Level)}
          >
            {level}
          </button>
        {/each}
      </div>
    </div>

    <div class="hud">
      <div class="target-box">
        <span class="label">Find</span>
        <span class="number" in:scale={{ duration: 200, start: 0.8 }}
          >{targetNumber}</span
        >
        <span class="progress">{foundCount} / {totalOccurrences}</span>
      </div>
      <div class="stats">
        <div class="stat">Score: {score}</div>
        <div class="stat">Streak: {streak} 🔥</div>
      </div>
    </div>

    <div class="grid" style="--size: {size}">
      {#each grid as row, rIndex}
        {#each row as val, cIndex}
          {@const r = rIndex + 1}
          {@const c = cIndex + 1}
          {@const isFound = foundCells.has(`${r},${c}`)}

          <button
            class="cell"
            class:found={isFound}
            onclick={() => handleCellClick(r, c, val)}
            disabled={isFound}
          >
            {#if isFound}
              {val}
            {/if}
          </button>
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  :root {
    --bg: #18181b;
    --cell-bg: #27272a;
    --cell-found: #10b981;
    --text: #f4f4f5;
  }

  .page-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem;
    min-height: 100vh;
    background-color: var(--bg);
    color: var(--text);
    font-family: "Roboto Mono", monospace;
  }

  @media (min-width: 1024px) {
    .page-layout {
      grid-template-columns: 250px 1fr;
      align-items: start;
    }
  }

  .sidebar {
    background: #27272a;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #3f3f46;
  }
  .sidebar h2 {
    color: #facc15;
    margin-top: 0;
    font-size: 1.2rem;
    text-transform: uppercase;
  }
  .sidebar ul {
    padding-left: 1.2rem;
    line-height: 1.6;
    color: #a1a1aa;
  }
  .sidebar li {
    margin-bottom: 0.5rem;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  h1 {
    color: #facc15;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .controls button {
    background: transparent;
    border: 1px solid #3f3f46;
    color: #a1a1aa;
    padding: 6px 12px;
    margin: 0 4px;
    cursor: pointer;
    border-radius: 4px;
    font-family: inherit;
  }
  .controls button.active {
    background: #facc15;
    color: black;
    border-color: #facc15;
  }

  .hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 600px;
    margin-bottom: 1.5rem;
  }

  .target-box {
    background: #3f3f46;
    padding: 1rem 2rem;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 2px solid #facc15;
    min-width: 150px;
  }

  .target-box .label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #a1a1aa;
  }
  .target-box .number {
    font-size: 3rem;
    font-weight: bold;
    color: white;
    line-height: 1;
  }
  .target-box .progress {
    font-size: 0.9rem;
    color: #facc15;
    margin-top: 0.25rem;
  }

  .stats {
    font-size: 1.1rem;
    text-align: right;
  }
  .stat {
    margin-bottom: 0.25rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--size), 1fr);
    gap: 4px;
    background: #000;
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .cell {
    width: 40px;
    height: 40px;
    background: var(--cell-bg);
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .cell:hover:not(:disabled) {
    background: #52525b;
    transform: scale(1.1);
    z-index: 2;
  }

  .cell.found {
    background: var(--cell-found);
    color: black;
    animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes pop {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
