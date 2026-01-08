<script lang="ts">
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { scale } from "svelte/transition";
  import confetti from "canvas-confetti";
  import { playSound } from "$lib";
  import gsap from "gsap";

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
  let streak = $state(0);
  let score = $state(0);

  function saveState() {
    const gameState = {
      target,
      hand,
      slots,
      score,
      streak,
    };
    localStorage.setItem("equation-builder-state", JSON.stringify(gameState));
  }

  $effect(() => {
    saveState();
  });

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

    // Animate Tiles
    setTimeout(() => {
      gsap.fromTo(
        ".tile",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, ease: "back.out(1.5)" },
      );
    }, 50);
  }

  function checkSolution() {
    if (slots.some((s) => s === null)) return;
    const [n1, op, n2] = slots;
    if (
      n1?.type !== "number" ||
      n2?.type !== "number" ||
      op?.type !== "operator"
    )
      return;
    let val = 0;
    if (op.val === "+") val = Number(n1.val) + Number(n2.val);
    else if (op.val === "-") val = Number(n1.val) - Number(n2.val);
    if (val === target) {
      playSound("win");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      score += 10;
      streak += 1;
      setTimeout(generatePuzzle, 2000);
    } else {
      playSound("wrong");
      streak = 0;
    }
  }

  function skipPuzzle() {
    streak = 0;
    generatePuzzle();
  }

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
    if (dragSource === "hand")
      hand = hand.filter((i) => i.id !== draggedItem!.id);
    else if (dragSource === "slot") slots[dragSourceIndex] = null;
    if (existing) hand.push(existing);
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
    const savedState = localStorage.getItem("equation-builder-state");
    if (savedState) {
      const gameState = JSON.parse(savedState);
      target = gameState.target;
      hand = gameState.hand;
      slots = gameState.slots;
      score = gameState.score;
      streak = gameState.streak;
    } else {
      generatePuzzle();
    }
  });
</script>

<div class="page-layout">
  <aside class="sidebar">
    <h2>How to Play</h2>
    <ul>
      <li>Target: <strong>{target}</strong>.</li>
      <li>Drag numbers (blue) and symbols (orange).</li>
      <li>Build an equation!</li>
      <li>Streak: {streak} 🔥</li>
    </ul>
  </aside>

  <div class="game-container">
    <h1>Equation Builder</h1>
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
      <button class="btn" onclick={skipPuzzle}>Skip Puzzle</button>
    </div>
  </div>
</div>

<style>
  h1 {
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }
  .target-display {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 3rem;
    background: var(--bg-panel);
    padding: 1rem 2rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    color: var(--text-main);
  }
  .highlight {
    color: var(--success);
    font-size: 3rem;
    margin-left: 1rem;
  }
  .equation-board {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 4rem;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    border: 1px solid var(--border);
  }
  .slot {
    width: 80px;
    height: 80px;
    background: var(--bg-panel);
    border: 2px dashed var(--text-muted);
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
    color: var(--text-muted);
  }
  .equals {
    font-size: 2rem;
    font-weight: bold;
    margin-left: 1rem;
    color: var(--text-muted);
  }
  .hand-area {
    display: flex;
    gap: 1rem;
    padding: 2rem;
    background: var(--bg-panel);
    border-radius: 16px;
    min-height: 120px;
    min-width: 400px;
    justify-content: center;
    border: 1px solid var(--border);
  }
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
    box-shadow: var(--shadow);
    user-select: none;
  }
  .tile:active {
    cursor: grabbing;
    transform: scale(1.05);
  }
  .tile.number {
    background: var(--primary);
  }
  .tile.operator {
    background: #f97316;
  }
  .btn {
    margin-top: 2rem;
    background: transparent;
    border: 1px solid var(--text-muted);
    color: var(--text-muted);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
  }
  .btn:hover {
    color: var(--text-main);
    border-color: var(--text-main);
  }
</style>
