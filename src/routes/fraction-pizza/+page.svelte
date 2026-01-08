<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import confetti from "canvas-confetti";
  import { playSound } from "$lib";
  import gsap from "gsap";
  import Pizza from "$lib/components/Pizza.svelte";

  const LEVELS = { Easy: [2, 3, 4], Medium: [5, 6, 8], Hard: [7, 9, 10, 12] };
  type Level = keyof typeof LEVELS;

  let currentLevel = $state<Level>("Easy");
  let score = $state(0);
  let streak = $state(0);
  let numerator1 = $state(1);
  let numerator2 = $state(1);
  let operator = $state("+");
  let denominator = $state(2);

  // Changed from number/boolean[] to a Set to track specific slices
  let selectedSlices = $state(new Set<number>());

  let gameState = $state<"playing" | "correct" | "wrong">("playing");
  let feedbackMessage = $state("");

  function saveState() {
    const state = {
      currentLevel,
      score,
      streak,
      numerator1,
      numerator2,
      operator,
      denominator,
      selectedSlices: Array.from(selectedSlices), // Persist as array
    };
    localStorage.setItem("fraction-pizza-state", JSON.stringify(state));
  }

  $effect(() => {
    saveState();
  });

  function generateLevel() {
    gameState = "playing";
    feedbackMessage = "";
    const possibleDenominators = LEVELS[currentLevel];
    denominator =
      possibleDenominators[
        Math.floor(Math.random() * possibleDenominators.length)
      ];
    const n1 = Math.floor(Math.random() * (denominator - 1)) + 1;
    const n2 = Math.floor(Math.random() * (denominator - n1)) + 1;
    numerator1 = n1;
    numerator2 = n2;
    selectedSlices = new Set();
  }

  function toggleSlice(index: number) {
    if (gameState !== "playing") return;

    // Toggle the specific slice index
    if (selectedSlices.has(index)) {
      selectedSlices.delete(index);
    } else {
      selectedSlices.add(index);
    }
    // Reassign to trigger reactivity
    selectedSlices = new Set(selectedSlices);

    playSound("pop");
  }

  const answer = $derived(numerator1 + numerator2);

  function checkAnswer() {
    // Check if the number of selected slices matches the required answer
    if (selectedSlices.size === answer) {
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
      feedbackMessage = `Oops! You selected ${selectedSlices.size}, but we needed ${answer}.`;
      playSound("wrong");
      gsap.to("svg", { x: 5, duration: 0.05, yoyo: true, repeat: 5 });
      setTimeout(() => {
        gameState = "playing";
        feedbackMessage = "";
        selectedSlices = new Set();
      }, 2000);
    }
  }

  onMount(() => {
    const stored = localStorage.getItem("fraction-pizza-state");
    if (stored) {
      const saved = JSON.parse(stored);
      currentLevel = saved.currentLevel;
      score = saved.score;
      streak = saved.streak;
      numerator1 = saved.numerator1;
      numerator2 = saved.numerator2;
      operator = saved.operator;
      denominator = saved.denominator;
      // Restore Set from Array
      if (Array.isArray(saved.selectedSlices)) {
        selectedSlices = new Set(saved.selectedSlices);
      }
    } else {
      generateLevel();
    }
  });
</script>

<div class="page-layout">
  <aside class="sidebar">
    <h2>How to Play</h2>
    <ul>
      <li>
        Target: <strong
          >{numerator1}/{denominator} + {numerator2}/{denominator}</strong
        >
      </li>
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
        <p>Select the correct number of slices to solve the equation.</p>
      </div>

      <div class="pizza-equation">
        <Pizza {denominator} numerator={numerator1} />
        <span class="operator">{operator}</span>
        <Pizza {denominator} numerator={numerator2} />
        <span class="operator">=</span>
        <Pizza
          {denominator}
          selectedIndices={Array.from(selectedSlices)}
          interactive={true}
          onclick={(i: number) => toggleSlice(i)}
        />
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
  .pizza-equation {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .operator {
    font-size: 2rem;
    font-weight: bold;
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
</style>
