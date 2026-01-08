<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fly, scale, fade } from "svelte/transition";
  import confetti from "canvas-confetti";

  // --- Configuration ---
  const LEVELS = {
    Easy: [2, 3, 4],
    Medium: [5, 6, 8],
    Hard: [7, 9, 10, 12],
  };

  type Level = keyof typeof LEVELS;

  // --- State ---
  let currentLevel = $state<Level>("Easy");
  let score = $state(0);
  let streak = $state(0);
  let numerator = $state(1);
  let denominator = $state(2); // Total slices

  // Array of booleans representing if a slice is selected
  // We recreate this whenever the denominator changes
  let selectedSlices = $state<boolean[]>([]);

  let gameState = $state<"playing" | "correct" | "wrong">("playing");
  let feedbackMessage = $state("");

  // --- SVG Math ---
  const VIEWBOX_SIZE = 200;
  const CENTER = VIEWBOX_SIZE / 2;
  const RADIUS = 90; // Leave some padding

  // Derived state for the SVG paths
  // We calculate this whenever 'denominator' changes
  let slices = $derived.by(() => {
    const sliceArray = [];
    const anglePerSlice = (2 * Math.PI) / denominator;

    for (let i = 0; i < denominator; i++) {
      // Calculate start and end angles (shifted by -PI/2 to start at 12 o'clock)
      const startAngle = i * anglePerSlice - Math.PI / 2;
      const endAngle = (i + 1) * anglePerSlice - Math.PI / 2;

      // Calculate coordinates
      const x1 = CENTER + RADIUS * Math.cos(startAngle);
      const y1 = CENTER + RADIUS * Math.sin(startAngle);
      const x2 = CENTER + RADIUS * Math.cos(endAngle);
      const y2 = CENTER + RADIUS * Math.sin(endAngle);

      // SVG Path Command
      // M = Move to Center
      // L = Line to outer edge (start)
      // A = Arc to outer edge (end)
      // Z = Close path (Line back to center)
      const largeArcFlag = anglePerSlice > Math.PI ? 1 : 0;

      const pathData = `
        M ${CENTER} ${CENTER}
        L ${x1} ${y1}
        A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;

      sliceArray.push({ id: i, d: pathData });
    }
    return sliceArray;
  });

  // --- Game Logic ---

  function generateLevel() {
    gameState = "playing";
    feedbackMessage = "";

    const possibleDenominators = LEVELS[currentLevel];
    denominator =
      possibleDenominators[
        Math.floor(Math.random() * possibleDenominators.length)
      ];

    // Random numerator (1 to denominator - 1)
    // We avoid 0/X and X/X (full pizza) usually, but X/X can be a fun "trick" question.
    // Let's stick to proper fractions for now (1 to N).
    numerator = Math.floor(Math.random() * denominator) + 1;

    // Reset selection
    selectedSlices = new Array(denominator).fill(false);
  }

  function toggleSlice(index: number) {
    if (gameState !== "playing") return;
    selectedSlices[index] = !selectedSlices[index];

    // Optional: Auto-check if we want instant feedback?
    // Or wait for a "Submit" button?
    // "Submit" button feels more deliberate for learning.
  }

  function checkAnswer() {
    const selectedCount = selectedSlices.filter(Boolean).length;

    if (selectedCount === numerator) {
      // Win
      gameState = "correct";
      score += 10;
      streak += 1;
      feedbackMessage = "Delicious!";

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ef4444", "#eab308", "#ffffff"], // Pizza colors
      });

      setTimeout(() => {
        generateLevel();
      }, 1500);
    } else {
      // Lose
      gameState = "wrong";
      streak = 0;
      feedbackMessage = `Oops! You selected ${selectedCount}, but we needed ${numerator}.`;

      // Allow retry or reset? Let's reset after a delay to keep flow.
      setTimeout(() => {
        gameState = "playing";
        feedbackMessage = "";
        selectedSlices = new Array(denominator).fill(false); // Reset selection to try again?
        // Or keep selection so they can fix it? -> Let's keep selection but change status back
      }, 2000);
    }
  }

  // --- Lifecycle ---
  onMount(() => {
    generateLevel();
  });
</script>

<div class="container">
  <div class="header">
    <h1>Pizza Slicer 🍕</h1>
    <div class="controls">
      {#each Object.keys(LEVELS) as level}
        <button
          class:active={currentLevel === level}
          onclick={() => {
            currentLevel = level as Level;
            generateLevel();
          }}
        >
          {level}
        </button>
      {/each}
    </div>
  </div>

  <div class="stats-bar">
    <div class="stat">Score: <span class="val">{score}</span></div>
    <div class="stat">Streak: <span class="val">{streak}</span></div>
  </div>

  <div class="game-area">
    <div class="instruction">
      <p>
        Select <span class="highlight">{numerator}</span> /
        <span class="highlight">{denominator}</span> of the pizza
      </p>
    </div>

    <div class="pizza-wrapper">
      <svg
        viewBox="0 0 {VIEWBOX_SIZE} {VIEWBOX_SIZE}"
        class:shake={gameState === "wrong"}
      >
        <circle cx={CENTER} cy={CENTER} r={RADIUS + 4} fill="#eab308" />

        {#each slices as slice, i}
          <path
            d={slice.d}
            class="slice"
            class:selected={selectedSlices[i]}
            onclick={() => toggleSlice(i)}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && toggleSlice(i)}
            fill={selectedSlices[i] ? "#ef4444" : "#fef08a"}
            stroke="#b45309"
            stroke-width="2"
          />

          {#if selectedSlices[i]}
            {@const angle =
              (i * (2 * Math.PI)) / denominator -
              Math.PI / 2 +
              (2 * Math.PI) / denominator / 2}
            {@const pepR = RADIUS * 0.6}
            {@const pepX = CENTER + pepR * Math.cos(angle)}
            {@const pepY = CENTER + pepR * Math.sin(angle)}
            <circle
              cx={pepX}
              cy={pepY}
              r="6"
              fill="#7f1d1d"
              opacity="0.8"
              pointer-events="none"
            />
          {/if}
        {/each}

        <circle cx={CENTER} cy={CENTER} r="0" fill="transparent" />
      </svg>
    </div>

    <div class="feedback-area">
      {#if feedbackMessage}
        <p class="feedback {gameState}" in:fly={{ y: 10 }}>{feedbackMessage}</p>
      {:else}
        <button class="check-btn" onclick={checkAnswer}>Check Order</button>
      {/if}
    </div>
  </div>
</div>

<style>
  :root {
    --bg: #18181b;
    --text: #f4f4f5;
    --accent: #eab308; /* Pizza Gold */
    --slice-empty: #fef08a; /* Light yellow dough */
    --slice-selected: #ef4444; /* Tomato Red */
    --crust: #b45309;
  }

  .container {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: "Roboto Mono", monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }

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

  .controls {
    display: flex;
    gap: 0.5rem;
    background: #27272a;
    padding: 4px;
    border-radius: 8px;
  }

  .controls button {
    background: transparent;
    border: none;
    color: #a1a1aa;
    padding: 6px 12px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .controls button.active {
    background: var(--accent);
    color: #000;
  }

  .stats-bar {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    font-size: 1.2rem;
  }

  .stat .val {
    font-weight: bold;
    color: var(--accent);
  }

  .game-area {
    background: #27272a;
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid #3f3f46;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .instruction {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .highlight {
    color: var(--accent);
    font-weight: bold;
    font-size: 2rem;
  }

  .pizza-wrapper {
    width: 300px;
    height: 300px;
    margin-bottom: 2rem;
  }

  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .slice {
    cursor: pointer;
    transition:
      fill 0.2s ease,
      transform 0.1s;
    transform-origin: center;
  }

  .slice:hover {
    filter: brightness(1.05);
    transform: scale(1.02);
    z-index: 10;
  }

  .slice.selected {
    fill: var(--slice-selected);
  }

  .check-btn {
    background: var(--accent);
    color: black;
    border: none;
    padding: 12px 32px;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    text-transform: uppercase;
    transition: transform 0.1s;
  }

  .check-btn:active {
    transform: scale(0.95);
  }

  .feedback-area {
    height: 50px; /* Prevent layout shift */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .feedback {
    font-size: 1.2rem;
    font-weight: bold;
  }
  .feedback.correct {
    color: #16a34a;
  }
  .feedback.wrong {
    color: #ef4444;
  }

  /* Animations */
  .shake {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-1px, 0, 0);
    }
    20%,
    80% {
      transform: translate3d(2px, 0, 0);
    }
    30%,
    50%,
    70% {
      transform: translate3d(-4px, 0, 0);
    }
    40%,
    60% {
      transform: translate3d(4px, 0, 0);
    }
  }
</style>
