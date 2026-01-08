<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { playSound } from "$lib";

  // --- Constants ---
  const GRID_SIZE = 20;
  const TILE_COUNT = 20; // 20x20 grid
  const SPEED_INITIAL = 150;

  // --- Types ---
  type Point = { x: number; y: number };
  type Operator = { type: "add" | "sub" | "mul"; val: number; label: string };
  type Food = Point & { op: Operator };

  // --- State ---
  let snake = $state<Point[]>([{ x: 10, y: 10 }]);
  let velocity = $state<Point>({ x: 0, y: 0 });
  let foodItems = $state<Food[]>([]);
  let currentVal = $state(0);
  let targetVal = $state(10);

  let score = $state(0);
  let highScore = $state(0);
  let streak = $state(0);
  let level = $state(1);

  let gameState = $state<"start" | "playing" | "gameover">("start");
  let gameLoop: any;

  // --- Persistence ---
  function saveState() {
    localStorage.setItem(
      "number-snake-save",
      JSON.stringify({ highScore, streak }),
    );
  }

  function loadState() {
    const saved = localStorage.getItem("number-snake-save");
    if (saved) {
      const data = JSON.parse(saved);
      highScore = data.highScore || 0;
      streak = data.streak || 0;
    }
  }

  // --- Game Logic ---
  function startGame() {
    loadState();
    snake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    velocity = { x: 0, y: -1 };
    currentVal = 0;
    score = 0;
    level = 1;
    gameState = "playing";
    generateTarget();
    spawnFood();

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, SPEED_INITIAL);
  }

  function generateTarget() {
    // Simple progressive difficulty
    const base = level * 10;
    targetVal = Math.floor(Math.random() * base) + base; // e.g. Level 1: 10-20
    currentVal = 0; // Reset current on new target
  }

  function spawnFood() {
    // Ensure we have enough food on screen
    while (foodItems.length < 5) {
      const item: Food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT),
        op: getRandomOperator(),
      };
      // Don't spawn on snake
      if (!snake.some((s) => s.x === item.x && s.y === item.y)) {
        foodItems.push(item);
      }
    }
  }

  function getRandomOperator(): Operator {
    const r = Math.random();
    if (r < 0.4)
      return {
        type: "add",
        val: Math.floor(Math.random() * 5) + 1,
        label: "+",
      };
    if (r < 0.7)
      return {
        type: "sub",
        val: Math.floor(Math.random() * 3) + 1,
        label: "-",
      };
    return { type: "mul", val: 2, label: "x" };
  }

  function handleInput(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowUp":
        if (velocity.y !== 1) velocity = { x: 0, y: -1 };
        break;
      case "ArrowDown":
        if (velocity.y !== -1) velocity = { x: 0, y: 1 };
        break;
      case "ArrowLeft":
        if (velocity.x !== 1) velocity = { x: -1, y: 0 };
        break;
      case "ArrowRight":
        if (velocity.x !== -1) velocity = { x: 1, y: 0 };
        break;
    }
  }

  function update() {
    if (gameState !== "playing") return;

    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Wall Collision
    if (
      head.x < 0 ||
      head.x >= TILE_COUNT ||
      head.y < 0 ||
      head.y >= TILE_COUNT
    ) {
      gameOver();
      return;
    }

    // Self Collision
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head); // Move head forward

    // Check Food Collision
    const eatenIndex = foodItems.findIndex(
      (f) => f.x === head.x && f.y === head.y,
    );
    if (eatenIndex !== -1) {
      const food = foodItems[eatenIndex];
      applyOp(food.op);
      foodItems.splice(eatenIndex, 1);
      playSound("pop");
      spawnFood();
      // Don't pop tail (snake grows)
    } else {
      snake.pop(); // Remove tail
    }
  }

  function applyOp(op: Operator) {
    if (op.type === "add") currentVal += op.val;
    if (op.type === "sub") currentVal -= op.val;
    if (op.type === "mul") currentVal *= op.val;

    // Check Win/Loss Condition for Round
    if (currentVal === targetVal) {
      levelUp();
    } else if (currentVal > targetVal) {
      // Overshot! Penalty or Game Over? Let's shrink snake or penalty
      playSound("wrong");
      currentVal = 0; // Hard reset
      score = Math.max(0, score - 50);
    }
  }

  function levelUp() {
    playSound("correct");
    score += 100 * level;
    level++;
    streak++;
    if (score > highScore) highScore = score;
    saveState();

    generateTarget();
    foodItems = []; // Clear board
    spawnFood();

    // Speed up slightly
    clearInterval(gameLoop);
    gameLoop = setInterval(update, Math.max(50, SPEED_INITIAL - level * 5));
  }

  function gameOver() {
    gameState = "gameover";
    playSound("wrong");
    streak = 0;
    saveState();
    clearInterval(gameLoop);
  }

  onMount(() => {
    loadState();
    window.addEventListener("keydown", handleInput);
  });

  onDestroy(() => {
    if (typeof window !== "undefined")
      window.removeEventListener("keydown", handleInput);
    if (gameLoop) clearInterval(gameLoop);
  });
</script>

<div class="page-container">
  <div class="game-area">
    <div class="header">
      <div class="score-card">
        <div>Score: {score}</div>
        <div class="small">High: {highScore}</div>
      </div>

      <div class="target-display">
        <div class="label">Target</div>
        <div class="value">{targetVal}</div>
        <div class="current">
          Current: <span class:danger={currentVal > targetVal}
            >{currentVal}</span
          >
        </div>
      </div>

      <div class="score-card">
        <div>Level {level}</div>
        <div class="small">Streak: {streak}</div>
      </div>
    </div>

    <div class="grid-container" style="--size: {TILE_COUNT}">
      {#if gameState === "start"}
        <div class="overlay">
          <h1>Number Snake 🐍</h1>
          <p>Eat numbers to reach the target exactly!</p>
          <button onclick={startGame}>Start Game</button>
        </div>
      {/if}

      {#if gameState === "gameover"}
        <div class="overlay">
          <h1>Game Over</h1>
          <p>Final Score: {score}</p>
          <button onclick={startGame}>Try Again</button>
        </div>
      {/if}

      {#each snake as seg, i}
        <div
          class="cell snake"
          class:head={i === 0}
          style="grid-column: {seg.x + 1}; grid-row: {seg.y + 1};"
        ></div>
      {/each}

      {#each foodItems as food}
        <div
          class="cell food {food.op.type}"
          style="grid-column: {food.x + 1}; grid-row: {food.y + 1};"
        >
          {food.op.label}{food.op.val}
        </div>
      {/each}
    </div>

    <div class="controls-hint">Use Arrow Keys to Move</div>
  </div>
</div>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    background: #111827;
    color: white;
  }
  .game-area {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .header {
    display: flex;
    gap: 2rem;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    max-width: 500px;
  }
  .score-card {
    background: #1f2937;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-align: center;
  }
  .small {
    font-size: 0.8rem;
    color: #9ca3af;
  }

  .target-display {
    text-align: center;
    background: #374151;
    padding: 0.5rem 2rem;
    border-radius: 12px;
    border: 2px solid #6366f1;
  }
  .target-display .value {
    font-size: 2rem;
    font-weight: bold;
    color: #818cf8;
  }
  .current {
    font-family: monospace;
  }
  .danger {
    color: #ef4444;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(var(--size), 1fr);
    grid-template-rows: repeat(var(--size), 1fr);
    width: 500px;
    height: 500px;
    background: #000;
    border: 4px solid #374151;
    position: relative;
  }

  .cell {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    border-radius: 2px;
  }
  .snake {
    background: #4ade80;
  }
  .snake.head {
    background: #22c55e;
    border: 1px solid white;
    z-index: 2;
  }

  .food {
    color: white;
    border-radius: 50%;
    z-index: 1;
  }
  .food.add {
    background: #3b82f6;
  } /* Blue */
  .food.sub {
    background: #ef4444;
  } /* Red */
  .food.mul {
    background: #a855f7;
  } /* Purple */

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    color: white;
  }
  button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #4ade80;
    border: none;
    border-radius: 4px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    color: #064e3b;
  }
  button:hover {
    background: #22c55e;
  }

  @media (max-width: 600px) {
    .grid-container {
      width: 350px;
      height: 350px;
    }
  }
</style>
