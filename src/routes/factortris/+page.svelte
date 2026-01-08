<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { playSound } from "$lib";

  // Constants
  const COLS = 6;
  const ROWS = 10;
  const NUMBERS = [
    4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 27, 30, 32, 35, 36, 40,
    42, 45, 48,
  ];

  type Block = { id: number; val: number; col: number; row: number };

  // State
  let grid = $state<Block[]>([]);
  let fallingBlock = $state<Block | null>(null);
  let score = $state(0);
  let highScore = $state(0);
  let streak = $state(0);
  let gameState = $state<"start" | "playing" | "gameover">("start");
  let gameLoop: any;
  let dropSpeed = $state(1000);

  // Input State
  let selectedFactors = $state<number[]>([]);

  // Persistence
  function saveState() {
    localStorage.setItem(
      "factortris-save",
      JSON.stringify({ highScore, streak }),
    );
  }

  function loadState() {
    const saved = localStorage.getItem("factortris-save");
    if (saved) {
      const data = JSON.parse(saved);
      highScore = data.highScore || 0;
      streak = data.streak || 0;
    }
  }

  function startGame() {
    loadState();
    grid = [];
    score = 0;
    dropSpeed = 1000;
    gameState = "playing";
    spawnBlock();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, dropSpeed);
  }

  function spawnBlock() {
    const val = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
    fallingBlock = {
      id: Math.random(),
      val,
      col: Math.floor(Math.random() * COLS),
      row: 0,
    };

    // Check immediate collision (Game Over)
    if (isColliding(fallingBlock.col, fallingBlock.row)) {
      gameOver();
    }
  }

  function isColliding(c: number, r: number): boolean {
    // Check floor
    if (r >= ROWS) return true;
    // Check other blocks
    return grid.some((b) => b.col === c && b.row === r);
  }

  function update() {
    if (gameState !== "playing" || !fallingBlock) return;

    const nextRow = fallingBlock.row + 1;

    if (isColliding(fallingBlock.col, nextRow)) {
      // Lock in place
      grid = [...grid, fallingBlock];
      fallingBlock = null;
      playSound("pop");
      spawnBlock();
    } else {
      fallingBlock.row = nextRow;
    }
  }

  function toggleFactor(num: number) {
    if (gameState !== "playing") return;

    if (selectedFactors.includes(num)) {
      selectedFactors = selectedFactors.filter((n) => n !== num);
    } else {
      selectedFactors = [...selectedFactors, num];
    }

    // If we have 2 numbers selected, try to clear a block
    if (selectedFactors.length === 2) {
      checkClear();
    }
  }

  function checkClear() {
    const product = selectedFactors[0] * selectedFactors[1];

    // Find blocks matching this product
    const initialCount = grid.length;
    grid = grid.filter((b) => b.val !== product);

    // Check falling block too
    if (fallingBlock && fallingBlock.val === product) {
      fallingBlock = null;
      spawnBlock();
      score += 50;
    }

    const clearedCount = initialCount - grid.length;

    if (clearedCount > 0 || (fallingBlock === null && product > 0)) {
      // Success
      score += 100 * clearedCount;
      streak++;
      if (score > highScore) highScore = score;
      playSound("correct");

      // Increase speed slightly
      dropSpeed = Math.max(200, dropSpeed - 10);
      clearInterval(gameLoop);
      gameLoop = setInterval(update, dropSpeed);
    } else {
      // Fail
      streak = 0;
      playSound("wrong");
    }

    saveState();
    selectedFactors = []; // Reset selection
  }

  function gameOver() {
    gameState = "gameover";
    playSound("wrong");
    clearInterval(gameLoop);
  }

  // Controls
  function moveLeft() {
    if (
      fallingBlock &&
      fallingBlock.col > 0 &&
      !isColliding(fallingBlock.col - 1, fallingBlock.row)
    ) {
      fallingBlock.col--;
    }
  }

  function moveRight() {
    if (
      fallingBlock &&
      fallingBlock.col < COLS - 1 &&
      !isColliding(fallingBlock.col + 1, fallingBlock.row)
    ) {
      fallingBlock.col++;
    }
  }

  function dropFast() {
    if (!fallingBlock) return;
    while (!isColliding(fallingBlock.col, fallingBlock.row + 1)) {
      fallingBlock.row++;
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (gameState !== "playing") return;
    if (e.key === "ArrowLeft") moveLeft();
    if (e.key === "ArrowRight") moveRight();
    if (e.key === "ArrowDown") dropFast();
  }

  onMount(() => {
    loadState();
    window.addEventListener("keydown", handleKey);
  });

  onDestroy(() => {
    if (typeof window !== "undefined")
      window.removeEventListener("keydown", handleKey);
    clearInterval(gameLoop);
  });
</script>

<div class="page-container">
  <div class="game-layout">
    <div class="sidebar">
      <div class="panel">
        <h2>Factortris</h2>
        <p>Select two factors to clear blocks.</p>
        <p>
          Example: Select <strong>3</strong> and <strong>4</strong> to clear
          <strong>12</strong>.
        </p>
      </div>
      <div class="stats">
        <div>Score: {score}</div>
        <div>High: {highScore}</div>
        <div>Streak: {streak} 🔥</div>
      </div>
    </div>

    <div class="board-container">
      {#if gameState === "start"}
        <div class="overlay">
          <h1>Factortris 🧱</h1>
          <button onclick={startGame}>Start Game</button>
        </div>
      {/if}
      {#if gameState === "gameover"}
        <div class="overlay">
          <h1>Game Over</h1>
          <button onclick={startGame}>Retry</button>
        </div>
      {/if}

      <div class="grid" style="--rows: {ROWS}; --cols: {COLS}">
        {#each grid as block (block.id)}
          <div
            class="block"
            in:scale
            style="grid-column: {block.col + 1}; grid-row: {block.row + 1};"
          >
            {block.val}
          </div>
        {/each}

        {#if fallingBlock}
          <div
            class="block falling"
            style="grid-column: {fallingBlock.col +
              1}; grid-row: {fallingBlock.row + 1};"
          >
            {fallingBlock.val}
          </div>
        {/if}
      </div>
    </div>

    <div class="controls-area">
      <div class="keypad">
        {#each [2, 3, 4, 5, 6, 7, 8, 9] as num}
          <button
            class="factor-btn"
            class:selected={selectedFactors.includes(num)}
            onclick={() => toggleFactor(num)}
          >
            {num}
          </button>
        {/each}
      </div>
      <div class="move-controls">
        <button onclick={moveLeft}>⬅️</button>
        <button onclick={dropFast}>⬇️</button>
        <button onclick={moveRight}>➡️</button>
      </div>
    </div>
  </div>
</div>

<style>
  .page-container {
    min-height: 100vh;
    background: #f0f9ff;
    display: flex;
    flex-direction: column;
  }

  .game-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    width: 300px;
    height: 500px;
    background: #1e293b;
    border: 4px solid #334155;
    position: relative;
  }

  .block {
    width: 100%;
    height: 100%;
    background: #3b82f6;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    border-radius: 4px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
  }
  .falling {
    background: #8b5cf6;
    border: 2px solid white;
  }

  .keypad {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 400px;
  }

  .factor-btn {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    font-weight: bold;
    color: #334155;
    transition: all 0.1s;
  }

  .factor-btn.selected {
    background: #ef4444;
    color: white;
    border-color: #b91c1c;
    transform: translateY(-2px);
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .overlay button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    background: #22c55e;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

  .move-controls {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  .move-controls button {
    padding: 1rem;
    font-size: 1.5rem;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: white;
    cursor: pointer;
  }

  @media (min-width: 768px) {
    .game-layout {
      flex-direction: row;
      justify-content: center;
      align-items: flex-start;
    }
    .controls-area {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }
</style>
