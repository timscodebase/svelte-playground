<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import confetti from "canvas-confetti";
  import { playSound } from "$lib";

  const LEVELS = { Easy: [2, 3, 4], Medium: [5, 6, 8], Hard: [7, 9, 10, 12] };
  type Level = keyof typeof LEVELS;

  let currentLevel = $state<Level>("Easy");
  let score = $state(0);
  let streak = $state(0);
  let numerator = $state(1);
  let denominator = $state(2);
  let selectedSlices = $state<boolean[]>([]);
  let gameState = $state<"playing" | "correct" | "wrong">("playing");
  let feedbackMessage = $state("");

  const VIEWBOX_SIZE = 200;
  const CENTER = VIEWBOX_SIZE / 2;
  const RADIUS = 90;

  let slices = $derived.by(() => {
    const sliceArray = [];
    const anglePerSlice = (2 * Math.PI) / denominator;
    for (let i = 0; i < denominator; i++) {
      const startAngle = i * anglePerSlice - Math.PI / 2;
      const endAngle = (i + 1) * anglePerSlice - Math.PI / 2;
      const x1 = CENTER + RADIUS * Math.cos(startAngle);
      const y1 = CENTER + RADIUS * Math.sin(startAngle);
      const x2 = CENTER + RADIUS * Math.cos(endAngle);
      const y2 = CENTER + RADIUS * Math.sin(endAngle);
      const largeArcFlag = anglePerSlice > Math.PI ? 1 : 0;
      const pathData = `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      sliceArray.push({ id: i, d: pathData });
    }
    return sliceArray;
  });

  function generateLevel() {
    gameState = "playing";
    feedbackMessage = "";
    const possibleDenominators = LEVELS[currentLevel];
    denominator =
      possibleDenominators[
        Math.floor(Math.random() * possibleDenominators.length)
      ];
    numerator = Math.floor(Math.random() * denominator) + 1;
    selectedSlices = new Array(denominator).fill(false);
  }

  function toggleSlice(index: number) {
    if (gameState !== "playing") return;
    selectedSlices[index] = !selectedSlices[index];
    playSound("pop");
  }

  function checkAnswer() {
    const selectedCount = selectedSlices.filter(Boolean).length;
    if (selectedCount === numerator) {
      gameState = "correct";
      score += 10;
      streak += 1;
      feedbackMessage = "Delicious!";
      playSound("correct");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ef4444", "#eab308", "#ffffff"],
      });
      setTimeout(() => {
        generateLevel();
      }, 1500);
    } else {
      gameState = "wrong";
      streak = 0;
      feedbackMessage = `Oops! You selected ${selectedCount}, but we needed ${numerator}.`;
      playSound("wrong");
      setTimeout(() => {
        gameState = "playing";
        feedbackMessage = "";
        selectedSlices = new Array(denominator).fill(false);
      }, 2000);
    }
  }

  onMount(() => {
    generateLevel();
  });
</script>

<div class="page-layout">
  <aside class="sidebar">
    <h2>How to Play</h2>
    <ul>
      <li>Target: <strong>{numerator}/{denominator}</strong>.</li>
      <li>Click slices to select pieces.</li>
      <li>Click <strong>Check Order</strong>.</li>
    </ul>
  </aside>

  <div class="game-container">
    <div class="header">
      <h1>Pizza Slicer 🍕</h1>
      <div class="controls">
        {#each Object.keys(LEVELS) as level}
          <button
            class:active={currentLevel === level}
            onclick={() => {
              currentLevel = level as Level;
              generateLevel();
            }}>{level}</button
          >
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
          <circle cx={CENTER} cy={CENTER} r={RADIUS + 4} fill="oklch(75% 0.15 85)" />
          {#each slices as slice, i}
            <path
              d={slice.d}
              class="slice"
              class:selected={selectedSlices[i]}
              onclick={() => toggleSlice(i)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === "Enter" && toggleSlice(i)}
              fill={selectedSlices[i] ? "oklch(65% 0.2 25)" : "oklch(95% 0.08 85)"}
              stroke="oklch(50% 0.1 50)"
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
                fill="oklch(30% 0.1 10)"
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
          <p class="feedback {gameState}" in:fly={{ y: 10 }}>
            {feedbackMessage}
          </p>
        {:else}
          <button class="check-btn" onclick={checkAnswer}>Check Order</button>
        {/if}
      </div>
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
  .controls {
    display: flex;
    gap: 0.5rem;
    background: var(--bg-panel);
    padding: 4px;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .controls button {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 6px 12px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .controls button.active {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .val {
    font-weight: bold;
    color: var(--accent);
  }
  .game-area {
    background: var(--bg-panel);
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 500px;
    box-shadow: var(--shadow);
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
    fill: #ef4444;
  }
  .check-btn {
    background: var(--accent);
    color: var(--accent-fg);
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
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .feedback {
    font-size: 1.2rem;
    font-weight: bold;
  }
  .feedback.correct {
    color: var(--success);
  }
  .feedback.wrong {
    color: var(--error);
  }
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
