<script lang="ts">
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { scale } from "svelte/transition";
  import confetti from "canvas-confetti";
  import { playSound } from "$lib";

  // --- State ---
  interface Item {
    id: number;
    val: string | number;
    type: "number" | "operator";
  }

  let target = $state(10);
  let hand = $state<Item[]>([]);
  let slots = $state<(Item | null)[]>([null, null, null, null, null]);

  let isDragging = $state(false);
  let draggedItem = $state<Item | null>(null);
  let dragSource = $state<"hand" | "slot" | null>(null);
  let dragSourceIndex = $state<number>(-1);

  // --- Logic ---
  function generatePuzzle() {
    const ops = ["+", "-"];
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const op = ops[Math.random() > 0.5 ? 0 : 1];

    let res = 0;
    if (op === "+") res = a + b;
    else res = a - b;

    if (res < 0) return generatePuzzle();

    target = res;
    slots = [null, null, null];

    const items: Item[] = [
      { id: 1, val: a, type: "number" },
      { id: 2, val: op, type: "operator" },
      { id: 3, val: b, type: "number" },
      { id: 4, val: Math.floor(Math.random() * 10), type: "number" },
      { id: 5, val: ops[Math.random() > 0.5 ? 0 : 1], type: "operator" },
    ];

    hand = items.sort(() => Math.random() - 0.5);
  }

  function checkSolution() {
    if (slots.some((s) => s === null)) return;
    const [n1, op, n2] = slots;
    if (
      n1?.type !== "number" ||
      n2?.type !== "number" ||
      op?.type !== "operator"
    ) {
      return;
    }

    let val = 0;
    if (op.val === "+") val = Number(n1.val) + Number(n2.val);
    else if (op.val === "-") val = Number(n1.val) - Number(n2.val);

    if (val === target) {
      playSound("win");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(generatePuzzle, 2000);
    } else {
      playSound("wrong");
    }
  }

  // --- Drag & Drop Handlers ---

  function onDragStart(
    e: DragEvent,
    item: Item,
    source: "hand" | "slot",
    index: number,
  ) {
    if (!e.dataTransfer) return;
    draggedItem = item;
    dragSource = source;
    dragSourceIndex = index;
    isDragging = true;
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (draggedItem) isDragging = true;
    }, 0);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  }

  function onDropHand(e: DragEvent) {
    e.preventDefault();
    if (!draggedItem) return;
    if (dragSource === "slot") {
      slots[dragSourceIndex] = null;
      hand.push(draggedItem);
      playSound("pop");
    }
    resetDrag();
    checkSolution();
  }

  function onDropSlot(e: DragEvent, index: number) {
    e.preventDefault();
    if (!draggedItem) return;

    const existing = slots[index];
    if (dragSource === "hand") {
      hand = hand.filter((i) => i.id !== draggedItem!.id);
    } else if (dragSource === "slot") {
      slots[dragSourceIndex] = null;
    }

    if (existing) {
      hand.push(existing);
    }

    slots[index] = draggedItem;

    playSound("pop");
    resetDrag();
    checkSolution();
  }

  function resetDrag() {
    draggedItem = null;
    dragSource = null;
    dragSourceIndex = -1;
    isDragging = false;
  }

  onMount(() => {
    generatePuzzle();
  });
</script>

<div class="page-layout">
  <aside class="sidebar">
    <h2>How to Play</h2>
    <ul>
      <li>Drag numbers and symbols into the empty slots.</li>
      <li>Create an equation that equals the <strong>Target</strong>.</li>
      <li>For example, if Target is 10, try <strong>5 + 5</strong>.</li>
      <li>Blue blocks are numbers, Orange blocks are operators.</li>
    </ul>
  </aside>

  <div class="container">
    <h1>Equation Builder</h1>
    <p class="subtitle">Drag numbers and symbols to match the target</p>

    <div class="target-display">
      Target: <span class="highlight">{target}</span>
    </div>

    <div class="equation-board">
      {#each slots as slot, i}
        <div
          class="slot"
          class:filled={slot !== null}
          ondragover={onDragOver}
          ondrop={(e) => onDropSlot(e, i)}
          role="group"
        >
          {#if slot}
            <div
              class="tile {slot.type}"
              draggable="true"
              ondragstart={(e) => onDragStart(e, slot, "slot", i)}
              transition:scale
            >
              {slot.val}
            </div>
          {:else}
            <span class="placeholder">?</span>
          {/if}
        </div>
      {/each}
      <div class="equals">= {target}</div>
    </div>

    <div
      class="hand-area"
      ondragover={onDragOver}
      ondrop={onDropHand}
      role="group"
    >
      {#each hand as item (item.id)}
        <div
          class="tile {item.type}"
          animate:flip={{ duration: 200 }}
          draggable="true"
          ondragstart={(e) => onDragStart(e, item, "hand", 0)}
        >
          {item.val}
        </div>
      {/each}
    </div>

    <div class="controls">
      <button class="btn" onclick={generatePuzzle}>Skip Puzzle</button>
    </div>
  </div>
</div>

<style>
  :root {
    --bg: #18181b;
    --slot-bg: #27272a;
    --tile-num: #3b82f6;
    --tile-op: #f97316;
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
    color: #a1a1aa;
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

  h1 {
    text-transform: uppercase;
    color: #a1a1aa;
    margin-bottom: 0.5rem;
  }
  .subtitle {
    color: #52525b;
    margin-bottom: 2rem;
  }

  .target-display {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 3rem;
    background: #27272a;
    padding: 1rem 2rem;
    border-radius: 12px;
    border: 1px solid #3f3f46;
  }
  .highlight {
    color: #10b981;
    font-size: 3rem;
    margin-left: 1rem;
  }

  /* Board */
  .equation-board {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 4rem;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 16px;
  }

  .slot {
    width: 80px;
    height: 80px;
    background: var(--slot-bg);
    border: 2px dashed #52525b;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .slot.filled {
    border-style: solid;
    border-color: transparent;
    background: transparent;
  }
  .slot .placeholder {
    font-size: 2rem;
    color: #3f3f46;
  }

  .equals {
    font-size: 2rem;
    font-weight: bold;
    margin-left: 1rem;
    color: #a1a1aa;
  }

  /* Hand */
  .hand-area {
    display: flex;
    gap: 1rem;
    padding: 2rem;
    background: #27272a;
    border-radius: 16px;
    min-height: 120px;
    min-width: 400px;
    justify-content: center;
    border: 1px solid #3f3f46;
  }

  /* Tiles */
  .tile {
    width: 70px;
    height: 70px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    color: white;
    cursor: grab;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    user-select: none;
  }

  .tile:active {
    cursor: grabbing;
    transform: scale(1.05);
  }
  .tile.number {
    background: var(--tile-num);
  }
  .tile.operator {
    background: var(--tile-op);
  }

  .btn {
    margin-top: 2rem;
    background: transparent;
    border: 1px solid #52525b;
    color: #a1a1aa;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
  }
  .btn:hover {
    color: white;
    border-color: white;
  }
</style>
