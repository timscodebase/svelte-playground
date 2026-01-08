<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fly, scale } from "svelte/transition";
  import confetti from "canvas-confetti";
  import { playSound } from "$lib";

  const GAME_DURATION = 60; // seconds
  type Operator = "+" | "-" | "÷";
  interface Question {
    text: string;
    answer: number;
  }

  let gameState = $state<"start" | "playing" | "finished">("start");
  let score = $state(0);
  let streak = $state(0);
  let timeLeft = $state(GAME_DURATION);
  let highScore = $state<number | null>(null);
  let question = $state<Question>({ text: "", answer: 0 });
  let userInput = $state<number | null>(null);
  let inputElement: HTMLInputElement;
  let feedback = $state<"none" | "correct" | "wrong">("none");
  let timerInterval: any = null;

  onMount(() => {
    const stored = localStorage.getItem("arithmetic-sprint-highscore");
    if (stored) highScore = parseInt(stored);
  });

  onDestroy(() => {
    clearInterval(timerInterval);
  });

  function generateQuestion() {
    const ops: Operator[] = ["+", "-", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 0,
      b = 0;
    switch (op) {
      case "+":
        a = Math.floor(Math.random() * 20) + 2;
        b = Math.floor(Math.random() * 20) + 2;
        question = { text: `${a} + ${b}`, answer: a + b };
        break;
      case "-":
        b = Math.floor(Math.random() * 15) + 2;
        a = Math.floor(Math.random() * 20) + b;
        question = { text: `${a} - ${b}`, answer: a - b };
        break;
      case "÷":
        const result = Math.floor(Math.random() * 11) + 2;
        b = Math.floor(Math.random() * 10) + 2;
        a = result * b;
        question = { text: `${a} ÷ ${b}`, answer: result };
        break;
    }
  }

  function startGame() {
    score = 0;
    streak = 0;
    timeLeft = GAME_DURATION;
    gameState = "playing";
    userInput = null;
    generateQuestion();
    setTimeout(() => inputElement?.focus(), 0);
    timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  function endGame() {
    clearInterval(timerInterval);
    gameState = "finished";
    if (highScore === null || score > highScore) {
      highScore = score;
      localStorage.setItem("arithmetic-sprint-highscore", score.toString());
      playSound("win");
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    }
  }

  function checkAnswer() {
    if (userInput === null) return;
    if (userInput === question.answer) {
      score += 1;
      streak += 1;
      feedback = "correct";
      playSound("correct");
      if (streak > 0 && streak % 10 === 0)
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      userInput = null;
      generateQuestion();
    } else {
      streak = 0;
      feedback = "wrong";
      playSound("wrong");
      userInput = null;
    }
    setTimeout(() => {
      feedback = "none";
    }, 500);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (gameState !== "playing") return;
    if (e.key === "Enter") checkAnswer();
  }
</script>

<div class="page-layout">
  <aside class="sidebar">
    <h2>How to Play</h2>
    <ul>
      <li>Race against the clock!</li>
      <li>You have <strong>{GAME_DURATION}s</strong>.</li>
      <li>Type answer, press <strong>Enter</strong>.</li>
    </ul>
  </aside>

  <div class="game-container">
    <h1>Arithmetic Sprint</h1>

    <div class="stats-bar">
      <div class="stat">
        <span class="label">Time</span><span
          class="value"
          class:urgent={timeLeft <= 10}>{timeLeft}s</span
        >
      </div>
      <div class="stat">
        <span class="label">Score</span><span class="value">{score}</span>
      </div>
      <div class="stat">
        <span class="label">Streak</span><span
          class="value streak"
          class:fire={streak >= 5}>{streak} 🔥</span
        >
      </div>
    </div>

    <div class="game-area">
      {#if gameState === "start"}
        <div class="card intro" in:fly={{ y: 20 }}>
          <h2>Ready?</h2>
          <p>Solve as many problems as you can in {GAME_DURATION} seconds.</p>
          <button class="primary-btn" onclick={startGame}>Start Sprint</button>
        </div>
      {:else if gameState === "playing"}
        <div class="card question-card" class:shake={feedback === "wrong"}>
          <div class="expression">{question.text}</div>
          <div class="equals">=</div>
          <input
            bind:this={inputElement}
            type="number"
            bind:value={userInput}
            onkeydown={handleKeydown}
            class:correct-flash={feedback === "correct"}
            class:wrong-flash={feedback === "wrong"}
            placeholder="?"
          />
          <button class="submit-btn" onclick={checkAnswer}>Gb</button>
        </div>
      {:else if gameState === "finished"}
        <div class="card result" in:scale>
          <h2>Time's Up!</h2>
          <div class="final-score">{score}</div>
          <p class="label">Final Score</p>
          {#if highScore !== null}<p class="highscore">
              High Score: {highScore}
            </p>{/if}
          <button class="primary-btn" onclick={startGame}>Play Again</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  h1 {
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 2rem;
  }
  .value.urgent {
    color: var(--error);
    animation: pulse 1s infinite;
  }
  .value.streak {
    color: var(--text-muted);
  }
  .value.streak.fire {
    color: #f97316;
    text-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
  }
  .game-area {
    width: 100%;
    max-width: 500px;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  .card {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: var(--shadow);
    gap: 1.5rem;
  }
  h2 {
    font-size: 2rem;
    margin: 0;
    color: var(--text-main);
  }
  p {
    color: var(--text-muted);
    text-align: center;
  }
  .final-score {
    font-size: 4rem;
    font-weight: bold;
    color: var(--accent);
    line-height: 1;
  }
  .expression {
    font-size: 3rem;
    font-weight: bold;
    color: var(--text-main);
  }
  .equals {
    font-size: 2rem;
    color: var(--text-muted);
    margin-top: -1rem;
    margin-bottom: -0.5rem;
  }
  input {
    background: transparent;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 2.5rem;
    color: var(--text-main);
    width: 150px;
    text-align: center;
    padding: 0.5rem;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }
  input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 15px rgba(234, 179, 8, 0.2);
  }
  .correct-flash {
    border-color: var(--success) !important;
    background-color: rgba(34, 197, 94, 0.1);
  }
  .wrong-flash {
    border-color: var(--error) !important;
    color: var(--error);
  }
  .shake {
    animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  .primary-btn {
    background-color: var(--accent);
    color: var(--accent-fg);
    border: none;
    font-size: 1.2rem;
    font-weight: bold;
    padding: 1rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.1s;
    text-transform: uppercase;
  }
  .primary-btn:hover {
    transform: scale(1.05);
  }
  .primary-btn:active {
    transform: scale(0.95);
  }
  .submit-btn {
    display: none;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
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
