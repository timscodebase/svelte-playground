<script lang="ts">
  import { onMount } from "svelte";
  import { scale } from "svelte/transition";
  import confetti from "canvas-confetti";
  import { playSound } from "$lib";
  import gsap from "gsap";

  const LEVELS = { Easy: 5, Medium: 8, Hard: 12 } as const;
  type Level = keyof typeof LEVELS;

  let currentLevel = $state<Level>("Medium");
  let size = $derived(LEVELS[currentLevel]);
  let targetNumber = $state(0);
  let foundCount = $state(0);
  let score = $state(0);
  let streak = $state(0);
  let foundCells = $state(new Set<string>());
  let totalOccurrences = $state(0);

  function saveState() {
    const gameState = {
      currentLevel,
      score,
      streak,
      targetNumber,
      foundCount,
      foundCells: Array.from(foundCells),
      totalOccurrences,
    };
    localStorage.setItem("grid-chase-state", JSON.stringify(gameState));
  }

  $effect(() => {
    saveState();
  });

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
    const r = Math.floor(Math.random() * size) + 1;
    const c = Math.floor(Math.random() * size) + 1;
    targetNumber = r * c;
    let count = 0;
    for (let i = 1; i <= size; i++) {
      for (let j = 1; j <= size; j++) {
        if (i * j === targetNumber) count++;
      }
    }
    totalOccurrences = count;
    // Animate Grid
    setTimeout(() => {
      gsap.fromTo(
        ".cell",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          stagger: { amount: 0.5, grid: [size, size], from: "random" },
        },
      );
    }, 0);
  }

  function handleCellClick(r: number, c: number, val: number) {
    const key = `${r},${c}`;
    if (foundCells.has(key)) return;
    const cellEl = document.querySelector(`.cell[data-key="${key}"]`);

    if (val === targetNumber) {
      playSound("pop");
      foundCells.add(key);
      foundCells = new Set(foundCells);
      foundCount++;
      score += 10;
      if (cellEl)
        gsap.fromTo(
          cellEl,
          { scale: 0.5 },
          { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.3)" },
        );
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
      if (cellEl)
        gsap.to(cellEl, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
    }
  }

  function setLevel(l: Level) {
    currentLevel = l;
    score = 0;
    streak = 0;
    generateRound();
  }
  onMount(() => {
    const savedState = localStorage.getItem("grid-chase-state");
    if (savedState) {
      const gameState = JSON.parse(savedState);
      currentLevel = gameState.currentLevel;
      score = gameState.score;
      streak = gameState.streak;
      targetNumber = gameState.targetNumber;
      foundCount = gameState.foundCount;
      foundCells = new Set(gameState.foundCells);
      totalOccurrences = gameState.totalOccurrences;
    } else {
      generateRound();
    }
  });
</script>

<div class="page-layout">
  <aside class="sidebar">
    <h2>How to Play</h2>
    <ul>
      <li>Find: <strong>{targetNumber}</strong>.</li>
      <li>Click cells that match (e.g. 3x4=12).</li>
      <li>Find all {totalOccurrences} instances.</li>
    </ul>
  </aside>

  <div class="game-container">
    <div class="header">
      <h1>Grid Chase</h1>
      <div class="controls">
        {#each Object.keys(LEVELS) as level}
          <button
            class:active={currentLevel === level}
            onclick={() => setLevel(level as Level)}>{level}</button
          >
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
            data-key={`${r},${c}`}
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
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  h1 {
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .controls button {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    padding: 6px 12px;
    margin: 0 4px;
    cursor: pointer;
    border-radius: 4px;
    font-family: inherit;
  }
  .controls button.active {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
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
    background: var(--bg-panel);
    padding: 1rem 2rem;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 2px solid var(--accent);
    min-width: 150px;
  }
  .target-box .label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .target-box .number {
    font-size: 3rem;
    font-weight: bold;
    color: var(--text-main);
    line-height: 1;
  }
  .target-box .progress {
    font-size: 0.9rem;
    color: var(--accent);
    margin-top: 0.25rem;
  }
  .stats {
    font-size: 1.1rem;
    text-align: right;
  }
  .stat {
    margin-bottom: 0.25rem;
    color: var(--text-main);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--size), 1fr);
    gap: 4px;
    background: var(--text-main);
    padding: 4px;
    border-radius: 8px;
    box-shadow: var(--shadow);
  }
  :global(:root:not(.dark)) .grid {
    background: #ccc;
  }
  .cell {
    width: 40px;
    height: 40px;
    background: var(--bg-panel);
    border: none;
    border-radius: 4px;
    color: var(--text-main);
    font-weight: bold;
    cursor: pointer;
    transition: all 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }
  .cell:hover:not(:disabled) {
    background: var(--bg-panel-hover);
    transform: scale(1.1);
    z-index: 2;
  }
  .cell.found {
    background: var(--success);
    color: white;
  }
</style>
