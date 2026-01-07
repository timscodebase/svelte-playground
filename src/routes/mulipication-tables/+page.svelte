<script lang="ts">
  import { fly } from "svelte/transition";
  import { onMount, onDestroy, flushSync } from "svelte";
  import confetti from "canvas-confetti";

  // --- Configuration ---
  const LEVELS = {
    Easy: 5,
    Medium: 8,
    Hard: 12,
  } as const;

  type Level = keyof typeof LEVELS;

  // --- Types ---
  type CellState = "empty" | "editing" | "correct" | "wrong" | "filled";

  interface Cell {
    value: number | null;
    tempValue: number | null;
    status: CellState;
    answer: number;
  }

  // --- State Initialization ---
  let currentLevel = $state<Level>("Hard");
  let SIZE = $derived(LEVELS[currentLevel]);

  function createGrid(s: number): Cell[][] {
    const newGrid: Cell[][] = [];
    for (let r = 0; r <= s; r++) {
      let row: Cell[] = [];
      for (let c = 0; c <= s; c++) {
        row.push({
          value: null,
          tempValue: null,
          status: "empty",
          answer: r * c,
        });
      }
      newGrid.push(row);
    }
    return newGrid;
  }

  // Svelte 5: Deeply reactive state object
  let grid = $state(createGrid(LEVELS["Hard"]));

  // Selection State
  let selectedR = $state<number | null>(null);
  let selectedC = $state<number | null>(null);

  // Timer State
  let startTime = $state<number | null>(null);
  let elapsed = $state(0);
  let bestTime = $state<number | null>(null);
  let gameFinished = $state(false);
  let timerInterval: any = null;

  // --- Lifecycle ---
  function loadBestTime() {
    const storedBest = localStorage.getItem(
      `multiplication-best-time-${currentLevel}`,
    );
    if (storedBest) {
      bestTime = parseFloat(storedBest);
    } else {
      bestTime = null;
    }
  }

  onMount(() => {
    loadBestTime();
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  // --- Helpers ---
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

  function setLevel(level: Level) {
    if (currentLevel === level) return;

    const update = () => {
      currentLevel = level;
      // We need to fully reset the game state when level changes
      resetGame(true);
    };

    // Use View Transition API if available for the slide animation
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        // flushSync forces the DOM to update synchronously inside the transition
        // so the browser can capture the 'after' state immediately
        flushSync(update);
      });
    } else {
      update();
    }
  }

  function checkWin() {
    let allCorrect = true;
    for (let r = 1; r <= SIZE; r++) {
      for (let c = 1; c <= SIZE; c++) {
        const cell = grid[r][c];
        // Check if value matches answer (even if not visually marked 'correct' yet)
        if (cell.value !== cell.answer) {
          allCorrect = false;
          break;
        }
      }
    }

    if (allCorrect && !gameFinished) {
      gameFinished = true;
      if (timerInterval) clearInterval(timerInterval);

      const finalTime = (Date.now() - startTime!) / 1000;
      elapsed = finalTime;

      if (bestTime === null || finalTime < bestTime) {
        bestTime = finalTime;
        localStorage.setItem(
          `multiplication-best-time-${currentLevel}`,
          finalTime.toString(),
        );
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  // --- Interaction Logic ---

  function selectCell(r: number, c: number) {
    if (r < 1 || r > SIZE || c < 1 || c > SIZE) return;
    // Close previous edit if changing selection
    if (
      (selectedR !== r || selectedC !== c) &&
      selectedR !== null &&
      selectedC !== null
    ) {
      if (grid[selectedR][selectedC].status === "editing") {
        cancelEdit(selectedR, selectedC);
      }
    }
    selectedR = r;
    selectedC = c;
    startTimer();
  }

  function moveSelection(dr: number, dc: number) {
    if (selectedR === null || selectedC === null) {
      selectCell(1, 1);
      return;
    }

    let newR = selectedR + dr;
    let newC = selectedC + dc;

    // Wrap columns
    if (newC > SIZE) {
      newC = 1;
      newR++;
    } else if (newC < 1) {
      newC = SIZE;
      newR--;
    }

    // Bounds check rows
    if (newR > SIZE || newR < 1) return;

    selectCell(newR, newC);
  }

  function startEditing(
    r: number,
    c: number,
    initialValue: string | null = null,
  ) {
    if (r === 0 || c === 0) return;
    selectCell(r, c);

    grid[r][c].status = "editing";

    // Auto-fill if user started typing a number
    if (initialValue) {
      grid[r][c].tempValue = parseInt(initialValue);
    } else {
      grid[r][c].tempValue = grid[r][c].value;
    }
  }

  function cancelEdit(r: number, c: number) {
    // Svelte 5: Direct mutation triggers update
    grid[r][c].status = grid[r][c].value ? "filled" : "empty";
    grid[r][c].tempValue = null;
    // Don't clear selection so user keeps their place
  }

  function confirmCell(r: number, c: number) {
    const cell = grid[r][c];

    // Basic validation
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
      checkWin();
      // Feature: Auto-advance on correct
      moveSelection(0, 1);
      // Revert green to filled after delay
      setTimeout(() => {
        // Ensure it wasn't changed to something else in the meantime
        if (grid[r][c].status === "correct") {
          grid[r][c].status = "filled";
        }
      }, 2000);
    } else {
      grid[r][c].status = "wrong";
    }
  }

  // --- Event Handlers ---

  function handleWindowKeydown(e: KeyboardEvent) {
    // 1. Arrow Navigation
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const map: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      moveSelection(map[e.key][0], map[e.key][1]);
      return;
    }

    if (selectedR === null || selectedC === null) return;

    const cell = grid[selectedR][selectedC];
    const isEditing = cell.status === "editing";

    // 2. Quick Entry (Type number to start editing immediately)
    if (!isEditing && /^[0-9]$/.test(e.key)) {
      e.preventDefault();
      // Stop window scroll or other defaults
      startEditing(selectedR, selectedC, e.key);
    }

    // 3. Enter to edit
    if (!isEditing && e.key === "Enter") {
      e.preventDefault();
      startEditing(selectedR, selectedC);
    }
  }

  function handleInputKeydown(e: KeyboardEvent, r: number, c: number) {
    e.stopPropagation();
    // Don't bubble to window

    if (e.key === "Enter") confirmCell(r, c);
    if (e.key === "Escape") cancelEdit(r, c);
    if (e.key === "Tab") {
      e.preventDefault();
      confirmCell(r, c);
      moveSelection(0, e.shiftKey ? -1 : 1);
    }
  }

  function checkAll() {
    for (let r = 1; r <= SIZE; r++) {
      for (let c = 1; c <= SIZE; c++) {
        const cell = grid[r][c];
        if (cell.value !== null) {
          const correct = cell.value === cell.answer;
          cell.status = correct ? "correct" : "wrong";
          if (correct) {
            setTimeout(() => {
              if (grid[r][c].status === "correct") grid[r][c].status = "filled";
            }, 2000);
          }
        }
      }
    }
    checkWin();
  }

  function resetGame(forceRebuild = false) {
    // Reset Game State
    startTime = null;
    elapsed = 0;
    gameFinished = false;
    if (timerInterval) clearInterval(timerInterval);
    selectedR = null;
    selectedC = null;

    // Refresh best time for current level
    loadBestTime();

    // Rebuild or Clear Grid
    if (forceRebuild) {
      grid = createGrid(LEVELS[currentLevel]);
    } else {
      grid = createGrid(LEVELS[currentLevel]);
    }
  }

  function clearAll() {
    if (!confirm("Are you sure you want to clear the whole board?")) return;
    resetGame(false);
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="container">
  <div class="header-section">
    <h1>Times Table Challenge</h1>

    <div class="levels">
      {#each Object.keys(LEVELS) as level}
        <button
          class="level-btn"
          class:active={currentLevel === level}
          onclick={() => setLevel(level as Level)}
        >
          {#if currentLevel === level}
            <div
              class="active-pill"
              style="view-transition-name: active-pill"
            ></div>
          {/if}
          <span class="btn-text">{level}</span>
        </button>
      {/each}
    </div>

    <div class="stats">
      <div class="stat-box">
        <span class="label">Time</span>
        <span class="value">{formatTime(elapsed)}</span>
      </div>
      {#if bestTime !== null}
        <div class="stat-box best">
          <span class="label">Best ({currentLevel})</span>
          <span class="value">{formatTime(bestTime)}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="grid-wrapper" style="--SIZE: {SIZE}">
    <div class="grid-row header-row">
      <div class="cell corner">X</div>
      {#each Array(SIZE) as _, i}
        <div class="cell header" class:highlighted={selectedC === i + 1}>
          {i + 1}
        </div>
      {/each}
    </div>

    {#each grid.slice(1) as row, r}
      <div class="grid-row">
        <div class="cell header" class:highlighted={selectedR === r + 1}>
          {r + 1}
        </div>

        {#snippet Cell(cell, isSelected, actualR, actualC)}
          <div
            class="cell interactive {cell.status}"
            class:selected={isSelected}
            onclick={() => startEditing(actualR, actualC)}
            role="button"
            tabindex="-1"
          >
            {#if cell.status === "editing"}
              <div class="input-area">
                <input
                  type="number"
                  bind:value={cell.tempValue}
                  onkeydown={(e) => handleInputKeydown(e, actualR, actualC)}
                  autoFocus
                />
              </div>

              <div class="actions" transition:fly={{ y: -20, duration: 250 }}>
                <button
                  class="btn-icon check"
                  onclick={(e) => {
                    e.stopPropagation();
                    confirmCell(actualR, actualC);
                  }}
                >
                  ✓
                </button>
                <button
                  class="btn-icon cancel"
                  onclick={(e) => {
                    e.stopPropagation();
                    cancelEdit(actualR, actualC);
                  }}
                >
                  ✕
                </button>
              </div>
            {:else}
              <span class="value">{cell.value ?? ""}</span>
            {/if}
          </div>
        {/snippet}

        {#each row.slice(1) as cell, c}
          {@const actualR = r + 1}
          {@const actualC = c + 1}
          {@const isSelected = selectedR === actualR && selectedC === actualC}

          {@render Cell(cell, isSelected, actualR, actualC)}
        {/each}
      </div>
    {/each}
  </div>

  <div class="controls">
    <button class="big-btn check-all" onclick={checkAll}>Check All</button>
    <button class="big-btn clear-all" onclick={clearAll}>Clear Board</button>
  </div>
</div>

<style>
  /* --- High Contrast / Dark Mode Theme --- */
  :root {
    --color-bg: #18181b;
    --color-header: #2563eb;
    --color-header-text: #ffffff;
    --color-header-highlight: #facc15;
    --color-header-highlight-text: #000000;
    --color-cell-bg: #27272a;
    --color-cell-filled: #3f3f46;
    --color-cell-hover: #52525b;
    --color-text: #f4f4f5;
    --color-correct: #16a34a;
    --color-wrong: #dc2626;
    --color-editing: #facc15;
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
    background-color: var(--color-bg);
    color: var(--color-text);
  }

  .header-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  h1 {
    color: #facc15;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  /* Levels */
  .levels {
    display: flex;
    gap: 0.25rem;
    background: #27272a;
    padding: 4px;
    border-radius: var(--radius);
    border: 1px solid #3f3f46;
  }

  .level-btn {
    position: relative; /* Contain the absolute pill */
    background: transparent;
    border: none;
    color: #a1a1aa;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-family: inherit;
    transition: color 0.2s;
    outline: none;
  }

  .level-btn:hover:not(.active) {
    background: #3f3f46;
    color: white;
  }

  .level-btn.active {
    color: white;
    /* Background is handled by .active-pill */
  }

  /* Sliding Pill */
  .active-pill {
    position: absolute;
    inset: 0;
    background-color: var(--color-header);
    border-radius: 4px;
    z-index: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .btn-text {
    position: relative;
    z-index: 1;
  }

  .stats {
    display: flex;
    gap: 2rem;
    margin-top: 0.5rem;
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

  /* --- Grid --- */
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
    grid-template-columns: 50px repeat(var(--SIZE), 50px);
    gap: 4px;
  }

  /* --- Cells --- */
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
      transform 0.2s,
      background-color 0.2s;
  }

  .header.highlighted {
    background-color: var(--color-header-highlight);
    color: var(--color-header-highlight-text);
    transform: scale(1.1);
    z-index: 5;
    box-shadow: 0 0 10px rgba(250, 204, 21, 0.5);
    border-color: white;
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
  }

  /* Selection State (Blue Ring) */
  .cell.selected {
    border: 2px solid #3b82f6;
    box-shadow: inset 0 0 0 1px #3b82f6;
    z-index: 10;
  }

  /* --- Interactive States --- */
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
    animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .interactive.wrong {
    background-color: var(--color-wrong);
    color: white;
    animation: shake 0.4s ease-in-out;
  }
  .interactive.filled {
    background-color: var(--color-cell-filled);
    color: #e4e4e7;
    border: 1px solid #52525b;
  }

  /* --- Editing UI --- */
  .input-area {
    width: 100%;
    height: 100%;
    background-color: var(--color-editing);
    color: var(--color-editing-text);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px 4px 0 0;
    position: relative;
    z-index: 2;
  }

  input {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    outline: none;
    padding: 0;
  }

  /* Pop-under buttons */
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
    overflow: hidden;
  }

  .btn-icon {
    flex: 1;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
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

  /* --- Controls --- */
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
    border-color: #16a34a;
    color: #16a34a;
    background: transparent;
  }
  .check-all:hover {
    background-color: #16a34a;
    color: #000;
  }
  .clear-all {
    border-color: #3f3f46;
    color: #a1a1aa;
    background: transparent;
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
