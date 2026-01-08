<script lang="ts">
  import { fly } from "svelte/transition";
  import { onMount, onDestroy, flushSync } from "svelte";
  import confetti from "canvas-confetti";
  import { playSound } from "$lib";

  const LEVELS = { Easy: 5, Medium: 8, Hard: 12 } as const;
  type Level = keyof typeof LEVELS;

  // ... (State logic same as previous, just copy logic here)
  type CellState = "empty" | "editing" | "correct" | "wrong" | "filled";
  interface Cell {
    value: number | null;
    tempValue: number | null;
    status: CellState;
    answer: number;
  }

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

  let grid = $state(createGrid(LEVELS["Hard"]));
  let selectedR = $state<number | null>(null);
  let selectedC = $state<number | null>(null);
  let startTime = $state<number | null>(null);
  let elapsed = $state(0);
  let bestTime = $state<number | null>(null);
  let gameFinished = $state(false);
  let timerInterval: any = null;

  function loadBestTime() {
    const storedBest = localStorage.getItem(
      `multiplication-best-time-${currentLevel}`,
    );
    bestTime = storedBest ? parseFloat(storedBest) : null;
  }

  onMount(() => {
    loadBestTime();
  });
  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

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
      resetGame(true);
    };
    if (document.startViewTransition)
      document.startViewTransition(() => flushSync(update));
    else update();
  }

  function checkWin() {
    let allCorrect = true;
    for (let r = 1; r <= SIZE; r++) {
      for (let c = 1; c <= SIZE; c++) {
        if (grid[r][c].value !== grid[r][c].answer) {
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
      playSound("win");
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }

  function selectCell(r: number, c: number) {
    if (r < 1 || r > SIZE || c < 1 || c > SIZE) return;
    if (
      (selectedR !== r || selectedC !== c) &&
      selectedR !== null &&
      selectedC !== null
    ) {
      if (grid[selectedR][selectedC].status === "editing")
        cancelEdit(selectedR, selectedC);
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
    if (newC > SIZE) {
      newC = 1;
      newR++;
    } else if (newC < 1) {
      newC = SIZE;
      newR--;
    }
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
    grid[r][c].tempValue = initialValue
      ? parseInt(initialValue)
      : grid[r][c].value;
  }

  function cancelEdit(r: number, c: number) {
    grid[r][c].status = grid[r][c].value ? "filled" : "empty";
    grid[r][c].tempValue = null;
  }

  function confirmCell(r: number, c: number) {
    const cell = grid[r][c];
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
      playSound("correct");
      checkWin();
      moveSelection(0, 1);
      setTimeout(() => {
        if (grid[r][c].status === "correct") grid[r][c].status = "filled";
      }, 2000);
    } else {
      grid[r][c].status = "wrong";
      playSound("wrong");
    }
  }

  function handleWindowKeydown(e: KeyboardEvent) {
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
    const isEditing = grid[selectedR][selectedC].status === "editing";
    if (!isEditing && /^[0-9]$/.test(e.key)) {
      e.preventDefault();
      startEditing(selectedR, selectedC, e.key);
    }
    if (!isEditing && e.key === "Enter") {
      e.preventDefault();
      startEditing(selectedR, selectedC);
    }
  }

  function handleInputKeydown(e: KeyboardEvent, r: number, c: number) {
    e.stopPropagation();
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
          if (correct)
            setTimeout(() => {
              if (grid[r][c].status === "correct") grid[r][c].status = "filled";
            }, 2000);
        }
      }
    }
    checkWin();
  }

  function resetGame(forceRebuild = false) {
    startTime = null;
    elapsed = 0;
    gameFinished = false;
    if (timerInterval) clearInterval(timerInterval);
    selectedR = null;
    selectedC = null;
    loadBestTime();
    grid = createGrid(LEVELS[currentLevel]);
  }

  function clearAll() {
    if (!confirm("Are you sure you want to clear the whole board?")) return;
    resetGame(false);
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="page-layout">
  <aside class="sidebar">
    <h2>How to Play</h2>
    <ul>
      <li>Select difficulty.</li>
      <li>Arrow keys or click to navigate.</li>
      <li>Type answer, press Enter.</li>
    </ul>
    <div class="controls-sidebar">
      <button class="big-btn check-all" onclick={checkAll}>Check All</button>
      <button class="big-btn clear-all" onclick={clearAll}>Clear Board</button>
    </div>
  </aside>

  <div class="game-container">
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
          <span class="label">Time</span><span class="value"
            >{formatTime(elapsed)}</span
          >
        </div>
        {#if bestTime !== null}
          <div class="stat-box best">
            <span class="label">Best ({currentLevel})</span><span class="value"
              >{formatTime(bestTime)}</span
            >
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
                    }}>✓</button
                  >
                  <button
                    class="btn-icon cancel"
                    onclick={(e) => {
                      e.stopPropagation();
                      cancelEdit(actualR, actualC);
                    }}>✕</button
                  >
                </div>
              {:else}
                <span class="value">{cell.value ?? ""}</span>
              {/if}
            </div>
          {/snippet}
          {#each row.slice(1) as cell, c}
            {@render Cell(
              cell,
              selectedR === r + 1 && selectedC === c + 1,
              r + 1,
              c + 1,
            )}
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .header-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  h1 {
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  /* Levels */
  .levels {
    display: flex;
    gap: 0.25rem;
    background: var(--bg-panel);
    padding: 4px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .level-btn {
    position: relative;
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-family: inherit;
    transition: color 0.2s;
    outline: none;
  }

  .level-btn:hover:not(.active) {
    background: var(--bg-panel-hover);
    color: var(--text-main);
  }

  .level-btn.active {
    color: var(--text-inverse);
  }

  .active-pill {
    position: absolute;
    inset: 0;
    background-color: var(--primary);
    border-radius: 4px;
    z-index: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .btn-text {
    position: relative;
    z-index: 1;
  }

  /* Grid */
  .grid-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--text-main); /* Dark border look */
    padding: 4px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: visible;
  }

  /* Fix for light mode grid gaps showing 'text-main' color (black) - using a variable hack or direct color */
  :global(:root.dark) .grid-wrapper {
    background: #000;
  }
  :global(:root) .grid-wrapper {
    background: #ccc;
  }

  .grid-row {
    display: grid;
    grid-template-columns: 50px repeat(var(--SIZE), 50px);
    gap: 4px;
  }

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
    color: var(--text-main);
  }

  .header {
    background-color: var(--primary);
    color: var(--text-inverse);
    border: 1px solid var(--primary-hover);
  }

  .header.highlighted {
    background-color: var(--accent);
    color: var(--accent-fg);
    transform: scale(1.1);
    z-index: 5;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    border-color: var(--bg-panel);
  }

  .corner {
    background-color: #9333ea;
    color: white;
  }

  .interactive {
    background-color: var(--bg-panel);
    cursor: pointer;
    overflow: hidden;
  }
  .interactive:hover {
    background-color: var(--bg-panel-hover);
  }

  .cell.selected {
    border: 2px solid var(--primary);
    box-shadow: inset 0 0 0 1px var(--primary);
    z-index: 10;
  }

  .interactive.editing {
    background-color: var(--bg-panel);
    border: 2px solid var(--text-main);
    transform: scale(1.15);
    z-index: 999;
    padding: 0;
    box-shadow: var(--shadow);
    overflow: visible;
  }

  .interactive.correct {
    background-color: var(--success);
    color: white;
    animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .interactive.wrong {
    background-color: var(--error);
    color: white;
    animation: shake 0.4s ease-in-out;
  }
  .interactive.filled {
    background-color: var(--bg-panel-hover);
    color: var(--text-muted);
  }

  .input-area {
    width: 100%;
    height: 100%;
    background-color: var(--accent);
    color: var(--accent-fg);
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
    color: currentColor;
  }

  .actions {
    position: absolute;
    top: 100%;
    left: -2px;
    width: calc(100% + 4px);
    height: 40px;
    display: flex;
    z-index: 1;
    border: 2px solid var(--text-main);
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
    background-color: var(--success);
    color: white;
  }
  .cancel {
    background-color: var(--error);
    color: white;
  }
  .btn-icon:hover {
    filter: brightness(1.1);
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
