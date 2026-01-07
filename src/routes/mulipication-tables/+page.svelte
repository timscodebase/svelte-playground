<script lang="ts">
  import { fly } from "svelte/transition";
  import { onMount, onDestroy } from "svelte";
  import confetti from "canvas-confetti";

  // Configuration
  const SIZE = 10;

  // Type definition for a single cell
  type CellState = "empty" | "editing" | "correct" | "wrong" | "filled";

  interface Cell {
    value: number | null;
    tempValue: number | null;
    status: CellState;
    answer: number;
  }

  // State
  let grid: Cell[][] = [];
  let activeRow: number | null = null;
  let activeCol: number | null = null;

  // Timer State
  let startTime: number | null = null;
  let elapsed: number = 0;
  let timerInterval: any = null;
  let bestTime: number | null = null;
  let gameFinished = false;

  onMount(() => {
    const storedBest = localStorage.getItem("multiplication-best-time");
    if (storedBest) {
      bestTime = parseFloat(storedBest);
    }
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  // Initialize the grid
  for (let r = 0; r <= SIZE; r++) {
    let row: Cell[] = [];
    for (let c = 0; c <= SIZE; c++) {
      row.push({
        value: null,
        tempValue: null,
        status: "empty",
        answer: r * c,
      });
    }
    grid.push(row);
  }
  grid = grid;

  // --- Timer Logic ---

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function startTimer() {
    if (startTime !== null || gameFinished) return;
    startTime = Date.now();
    timerInterval = setInterval(() => {
      elapsed = (Date.now() - startTime!) / 1000;
    }, 100);
  }

  function checkWin() {
    let allCorrect = true;
    for (let r = 1; r <= SIZE; r++) {
      for (let c = 1; c <= SIZE; c++) {
        if (grid[r][c].status !== "correct" && grid[r][c].status !== "filled") {
          // If it's not explicitly marked correct/filled, check the value
          // This handles cases where user types blindly without hitting enter
          if (grid[r][c].value !== grid[r][c].answer) {
            allCorrect = false;
            break;
          }
        }
      }
    }

    if (allCorrect && !gameFinished) {
      gameFinished = true;
      clearInterval(timerInterval);
      const finalTime = (Date.now() - startTime!) / 1000;
      elapsed = finalTime;

      // Update Best Time
      if (bestTime === null || finalTime < bestTime) {
        bestTime = finalTime;
        localStorage.setItem("multiplication-best-time", finalTime.toString());
      }

      // Celebrate
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  // --- Actions ---

  function activateCell(r: number, c: number) {
    if (r === 0 || c === 0) return;

    // Start timer on first interaction
    startTimer();

    // Highlight headers
    activeRow = r;
    activeCol = c;

    // Reset others
    grid = grid.map((row) =>
      row.map((cell) => {
        if (cell.status === "editing") {
          return { ...cell, status: cell.value ? "filled" : "empty" };
        }
        return cell;
      }),
    );

    // Set current to editing
    grid[r][c].status = "editing";
    grid[r][c].tempValue = grid[r][c].value;
  }

  function cancelEdit(r: number, c: number) {
    grid[r][c].status = grid[r][c].value ? "filled" : "empty";
    grid[r][c].tempValue = null;
    activeRow = null;
    activeCol = null;
  }

  function confirmCell(r: number, c: number) {
    const cell = grid[r][c];

    // Validate input
    if (
      cell.tempValue === null ||
      isNaN(Number(cell.tempValue)) ||
      cell.tempValue.toString() === ""
    ) {
      cancelEdit(r, c);
      return;
    }

    const inputVal = Number(cell.tempValue);
    const isCorrect = inputVal === cell.answer;

    grid[r][c].value = inputVal;
    activeRow = null;
    activeCol = null;

    if (isCorrect) {
      grid[r][c].status = "correct";
      checkWin(); // Check if this was the last one
      setTimeout(() => {
        if (grid[r][c].status === "correct") {
          grid[r][c].status = "filled";
        }
      }, 2000);
    } else {
      grid[r][c].status = "wrong";
    }
  }

  function handleKeydown(e: KeyboardEvent, r: number, c: number) {
    if (e.key === "Enter") confirmCell(r, c);
    if (e.key === "Escape") cancelEdit(r, c);
  }

  // --- Global Controls ---

  function checkAll() {
    for (let r = 1; r <= SIZE; r++) {
      for (let c = 1; c <= SIZE; c++) {
        const cell = grid[r][c];
        if (cell.value !== null) {
          if (cell.value === cell.answer) {
            cell.status = "correct";
            setTimeout(() => {
              if (grid[r][c].status === "correct") grid[r][c].status = "filled";
            }, 2000);
          } else {
            cell.status = "wrong";
          }
        }
      }
    }
    grid = grid;
    checkWin();
  }

  function clearAll() {
    if (!confirm("Are you sure you want to clear the whole board?")) return;

    // Reset Game State
    startTime = null;
    elapsed = 0;
    gameFinished = false;
    if (timerInterval) clearInterval(timerInterval);
    activeRow = null;
    activeCol = null;

    for (let r = 1; r <= SIZE; r++) {
      for (let c = 1; c <= SIZE; c++) {
        grid[r][c].value = null;
        grid[r][c].tempValue = null;
        grid[r][c].status = "empty";
      }
    }
    grid = grid;
  }
</script>

<div class="container">
  <div class="header-section">
    <h1>Times Table Challenge</h1>
    <div class="stats">
      <div class="stat-box">
        <span class="label">Time</span>
        <span class="value">{formatTime(elapsed)}</span>
      </div>
      {#if bestTime !== null}
        <div class="stat-box best">
          <span class="label">Best</span>
          <span class="value">{formatTime(bestTime)}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="grid-wrapper">
    <div class="grid-row header-row">
      <div class="cell corner">X</div>
      {#each Array(SIZE) as _, i}
        <div class="cell header" class:highlighted={activeCol === i + 1}>
          {i + 1}
        </div>
      {/each}
    </div>

    {#each grid.slice(1) as row, r}
      <div class="grid-row">
        <div class="cell header" class:highlighted={activeRow === r + 1}>
          {r + 1}
        </div>

        {#each row.slice(1) as cell, c}
          {@const actualR = r + 1}
          {@const actualC = c + 1}

          <div
            class="cell interactive {cell.status}"
            on:click={() => activateCell(actualR, actualC)}
            role="button"
            tabindex="0"
          >
            {#if cell.status === "editing"}
              <div class="input-area">
                <input
                  type="number"
                  bind:value={cell.tempValue}
                  on:keydown={(e) => handleKeydown(e, actualR, actualC)}
                  autoFocus
                />
              </div>

              <div class="actions" transition:fly={{ y: -20, duration: 250 }}>
                <button
                  class="btn-icon check"
                  on:click|stopPropagation={() => confirmCell(actualR, actualC)}
                >
                  ✓
                </button>
                <button
                  class="btn-icon cancel"
                  on:click|stopPropagation={() => cancelEdit(actualR, actualC)}
                >
                  ✕
                </button>
              </div>
            {:else}
              <span class="value">
                {cell.value ?? ""}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="controls">
    <button class="big-btn check-all" on:click={checkAll}>Check All</button>
    <button class="big-btn clear-all" on:click={clearAll}>Clear Board</button>
  </div>
</div>

<style>
  /* --- High Contrast / Dark Mode Theme --- */
  :root {
    --color-bg: #18181b;

    /* Headers */
    --color-header: #2563eb;
    --color-header-text: #ffffff;
    --color-header-highlight: #facc15; /* Yellow highlight for headers */
    --color-header-highlight-text: #000000;

    /* Cells */
    --color-cell-bg: #27272a;
    --color-cell-filled: #3f3f46;
    --color-cell-hover: #52525b;
    --color-text: #f4f4f5;

    /* States */
    --color-correct: #16a34a;
    --color-wrong: #dc2626;
    --color-editing: #facc15; /* Bright Yellow */
    --color-editing-text: #000000;

    --shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    --radius: 6px;
  }

  .container {
    font-family: "Roboto Mono", monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    min-height: 100vh;
  }

  .header-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.5rem;
    width: 100%;
    max-width: 600px;
  }

  h1 {
    color: #facc15;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 1rem;
    text-align: center;
  }

  .stats {
    display: flex;
    gap: 2rem;
  }

  .stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #27272a;
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    border: 1px solid #3f3f46;
    min-width: 100px;
  }

  .stat-box.best {
    border-color: var(--color-correct);
  }

  .stat-box .label {
    font-size: 0.8rem;
    color: #a1a1aa;
    text-transform: uppercase;
  }

  .stat-box .value {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
  }

  /* --- Grid Layout --- */
  .grid-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #000;
    padding: 8px;
    border: 1px solid #333;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: visible;
  }

  .grid-row {
    display: grid;
    grid-template-columns: 50px repeat(10, 50px);
    gap: 4px;
  }

  /* --- Cell Styling --- */
  .cell {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius);
    font-weight: bold;
    font-size: 1.2rem;
    position: relative;
    transition: all 0.2s ease;
    color: var(--color-text);
  }

  .header {
    background-color: var(--color-header);
    color: var(--color-header-text);
    border: 1px solid #1e40af;
    transition:
      background-color 0.2s,
      color 0.2s;
  }

  /* Highlight state for headers */
  .header.highlighted {
    background-color: var(--color-header-highlight);
    color: var(--color-header-highlight-text);
    border-color: white;
    transform: scale(1.05);
    z-index: 5;
    box-shadow: 0 0 10px rgba(250, 204, 21, 0.5);
  }

  .corner {
    background-color: #9333ea;
    color: white;
    border: 1px solid #7e22ce;
  }

  .interactive {
    background-color: var(--color-cell-bg);
    cursor: pointer;
    border: 1px solid #3f3f46;
    overflow: hidden;
  }

  .interactive:hover {
    background-color: var(--color-cell-hover);
    border-color: #71717a;
  }

  /* --- States --- */
  .interactive.editing {
    background-color: transparent;
    border: 2px solid white;
    cursor: default;
    transform: scale(1.15);
    z-index: 999;
    padding: 0;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    overflow: visible;
  }

  .interactive.correct {
    background-color: var(--color-correct);
    color: white;
    border-color: #15803d;
    animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .interactive.wrong {
    background-color: var(--color-wrong);
    color: white;
    border-color: #b91c1c;
    animation: shake 0.4s ease-in-out;
  }

  .interactive.filled {
    background-color: var(--color-cell-filled);
    color: #e4e4e7;
    border: 1px solid #52525b;
  }

  /* --- Editing Layout --- */

  .input-area {
    width: 100%;
    height: 100%;
    background-color: var(--color-editing);
    color: var(--color-editing-text);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
    border-radius: 4px 4px 0 0;
  }

  input {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    text-align: center;
    font-size: 1.2rem;
    font-family: inherit;
    font-weight: bold;
    color: inherit;
    outline: none;
    padding: 0;
    margin: 0;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .actions {
    position: absolute;
    top: 100%;
    left: -2px;
    width: calc(100% + 4px);
    height: 40px;
    display: flex;
    z-index: 1;
    border: 2px solid white;
    border-top: none;
    border-radius: 0 0 6px 6px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .btn-icon {
    flex: 1;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
  }

  .check {
    background-color: #16a34a;
    color: white;
  }

  .cancel {
    background-color: #dc2626;
    color: white;
  }

  .btn-icon:hover {
    filter: brightness(1.1);
  }

  /* --- Footer Controls --- */
  .controls {
    margin-top: 2rem;
    display: flex;
    gap: 1rem;
  }

  .big-btn {
    border: none;
    padding: 12px 24px;
    border-radius: var(--radius);
    font-size: 1.1rem;
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    border: 2px solid transparent;
  }

  .check-all {
    background-color: transparent;
    border-color: #16a34a;
    color: #16a34a;
  }

  .check-all:hover {
    background-color: #16a34a;
    color: #000;
  }

  .clear-all {
    background-color: transparent;
    border-color: #3f3f46;
    color: #a1a1aa;
  }

  .clear-all:hover {
    border-color: #dc2626;
    color: #dc2626;
  }

  .big-btn:active {
    transform: translateY(2px);
  }

  @keyframes pop {
    0% {
      transform: scale(0.8);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-4px);
    }
    75% {
      transform: translateX(4px);
    }
  }
</style>
