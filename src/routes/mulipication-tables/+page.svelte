<script lang="ts">
  import { fly } from "svelte/transition";

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

  // Initialize the grid
  let grid: Cell[][] = [];

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

  // --- Actions ---

  function activateCell(r: number, c: number) {
    if (r === 0 || c === 0) return;

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

    if (isCorrect) {
      grid[r][c].status = "correct";
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
  }

  function clearAll() {
    if (!confirm("Are you sure you want to clear the whole board?")) return;

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
  <h1>Times Table Challenge</h1>

  <div class="grid-wrapper">
    <div class="grid-row header-row">
      <div class="cell corner">X</div>
      {#each Array(SIZE) as _, i}
        <div class="cell header">{i + 1}</div>
      {/each}
    </div>

    {#each grid.slice(1) as row, r}
      <div class="grid-row">
        <div class="cell header">{r + 1}</div>

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
    /*background-color: var(--color-bg);*/
    /*color: var(--color-text);*/
    padding: 2rem;
    min-height: 100vh;
  }

  h1 {
    color: #facc15;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 1.5rem;
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
    /* Ensure the popups don't get cut off by the container */
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
    position: relative; /* Anchor for absolute positioning */
    transition: all 0.2s ease;
    color: var(--color-text);
  }

  .header {
    background-color: var(--color-header);
    color: var(--color-header-text);
    border: 1px solid #1e40af;
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
    /* Default is hidden to clip hover effects, but changed for editing below */
    overflow: hidden;
  }

  .interactive:hover {
    background-color: var(--color-cell-hover);
    border-color: #71717a;
  }

  /* --- States --- */
  .interactive.editing {
    background-color: transparent; /* Wrapper is transparent, children have color */
    border: 2px solid white;
    cursor: default;
    transform: scale(1.15);
    z-index: 999; /* Must be on top of everything */
    padding: 0;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);

    /* Allow buttons to hang outside */
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

  /* Input Area: Fills the original cell */
  .input-area {
    width: 100%;
    height: 100%; /* 50px */
    background-color: var(--color-editing);
    color: var(--color-editing-text);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2; /* Sits on top of the sliding buttons */
    border-radius: 4px 4px 0 0; /* Rounded top */
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

  /* Buttons: Render BELOW the cell */
  .actions {
    position: absolute;
    top: 100%; /* Push completely below the cell */
    left: -2px; /* Align with border accounting for width */
    width: calc(100% + 4px); /* Match width including borders */
    height: 40px; /* Specific height for buttons */

    display: flex;
    z-index: 1; /* Slide out from behind input */

    /* Create the white border effect around the dropdown part */
    border: 2px solid white;
    border-top: none; /* Connect to top part */
    border-radius: 0 0 6px 6px;
    box-sizing: border-box;
    overflow: hidden; /* rounded corners clip content */
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

  /* --- Keyframes --- */
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
