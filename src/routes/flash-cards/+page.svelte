<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fly, scale } from "svelte/transition";
  import confetti from "canvas-confetti";

  // --- Configuration ---
  const GAME_DURATION = 60; // seconds

  type Operator = "+" | "-" | "÷";

  interface Question {
    text: string;
    answer: number;
  }

  // --- State ---
  let gameState = $state<"start" | "playing" | "finished">("start");
  let score = $state(0);
  let streak = $state(0);
  let timeLeft = $state(GAME_DURATION);
  let highScore = $state<number | null>(null);

  // Current Question State
  let question = $state<Question>({ text: "", answer: 0 });
  let userInput = $state<number | null>(null);
  let inputElement: HTMLInputElement;

  // Visual Feedback State
  let feedback = $state<"none" | "correct" | "wrong">("none");

  let timerInterval: any = null;

  // --- Lifecycle ---
  onMount(() => {
    const stored = localStorage.getItem("arithmetic-sprint-highscore");
    if (stored) highScore = parseInt(stored);
  });

  onDestroy(() => {
    clearInterval(timerInterval);
  });

  // --- Game Logic ---

  function generateQuestion() {
    const ops: Operator[] = ["+", "-", "÷"];
    // Increase probability of simple + / - for speed
    const op = ops[Math.floor(Math.random() * ops.length)];

    let a = 0,
      b = 0;

    switch (op) {
      case "+":
        a = Math.floor(Math.random() * 20) + 2; // 2 to 21
        b = Math.floor(Math.random() * 20) + 2;
        question = { text: `${a} + ${b}`, answer: a + b };
        break;
      case "-":
        b = Math.floor(Math.random() * 15) + 2;
        // Ensure result is positive
        a = Math.floor(Math.random() * 20) + b;
        question = { text: `${a} - ${b}`, answer: a - b };
        break;
      case "÷":
        // Work backwards: result * divisor = dividend
        const result = Math.floor(Math.random() * 11) + 2; // 2 to 12
        b = Math.floor(Math.random() * 10) + 2; // 2 to 11
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

    // Focus input on next tick
    setTimeout(() => inputElement?.focus(), 0);

    timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function endGame() {
    clearInterval(timerInterval);
    gameState = "finished";
    if (highScore === null || score > highScore) {
      highScore = score;
      localStorage.setItem("arithmetic-sprint-highscore", score.toString());
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
      });
    }
  }

  function checkAnswer() {
    if (userInput === null) return;

    if (userInput === question.answer) {
      // Correct
      score += 1;
      streak += 1;
      feedback = "correct";

      // Streak bonuses
      if (streak > 0 && streak % 10 === 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#facc15", "#2563eb"], // Gold & Blue
        });
      }

      userInput = null;
      generateQuestion();
    } else {
      // Wrong
      streak = 0;
      feedback = "wrong";
      // Clear input to let them try again? Or move on?
      // Standard sprint logic: usually you must fix it, or it penalizes.
      // Let's clear and shake.
      userInput = null;
    }

    // Reset feedback animation class
    setTimeout(() => {
      feedback = "none";
    }, 500);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (gameState !== "playing") return;
    if (e.key === "Enter") {
      checkAnswer();
    }
  }
</script>

<div class="container">
  <h1>Arithmetic Sprint</h1>

  <div class="stats-bar">
    <div class="stat">
      <span class="label">Time</span>
      <span class="value" class:urgent={timeLeft <= 10}>{timeLeft}s</span>
    </div>
    <div class="stat">
      <span class="label">Score</span>
      <span class="value">{score}</span>
    </div>
    <div class="stat">
      <span class="label">Streak</span>
      <span class="value streak" class:fire={streak >= 5}>{streak} 🔥</span>
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
        <div class="expression">
          {question.text}
        </div>
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
        <div class="final-score">
          {score}
        </div>
        <p class="label">Final Score</p>

        {#if highScore !== null}
          <p class="highscore">High Score: {highScore}</p>
        {/if}

        <button class="primary-btn" onclick={startGame}>Play Again</button>
      </div>
    {/if}
  </div>
</div>

<style>
  :root {
    --bg-color: #18181b;
    --card-bg: #27272a;
    --text-main: #f4f4f5;
    --accent: #facc15;
    --correct: #16a34a;
    --wrong: #dc2626;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    background-color: var(--bg-color);
    color: var(--text-main);
    font-family: "Roboto Mono", monospace;
    padding: 2rem;
  }

  h1 {
    text-transform: uppercase;
    color: var(--accent);
    letter-spacing: 2px;
    margin-bottom: 2rem;
  }

  /* Stats Bar */
  .stats-bar {
    display: flex;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--card-bg);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: 1px solid #3f3f46;
    min-width: 90px;
  }

  .stat .label {
    font-size: 0.8rem;
    color: #a1a1aa;
    text-transform: uppercase;
  }

  .stat .value {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .value.urgent {
    color: var(--wrong);
    animation: pulse 1s infinite;
  }

  .value.streak {
    color: #a1a1aa;
  }
  .value.streak.fire {
    color: #f97316;
    text-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
  }

  /* Game Area */
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
    background: var(--card-bg);
    border: 1px solid #3f3f46;
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    gap: 1.5rem;
  }

  /* Intro / Result Text */
  h2 {
    font-size: 2rem;
    margin: 0;
  }
  p {
    color: #a1a1aa;
    text-align: center;
  }

  .final-score {
    font-size: 4rem;
    font-weight: bold;
    color: var(--accent);
    line-height: 1;
  }

  /* Question UI */
  .expression {
    font-size: 3rem;
    font-weight: bold;
  }

  .equals {
    font-size: 2rem;
    color: #52525b;
    margin-top: -1rem;
    margin-bottom: -0.5rem;
  }

  input {
    background: transparent;
    border: 2px solid #52525b;
    border-radius: 8px;
    font-size: 2.5rem;
    color: white;
    width: 150px;
    text-align: center;
    padding: 0.5rem;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }

  input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 15px rgba(250, 204, 21, 0.2);
  }

  /* Feedback Animations */
  .correct-flash {
    border-color: var(--correct) !important;
    background-color: rgba(22, 163, 74, 0.1);
  }
  .wrong-flash {
    border-color: var(--wrong) !important;
    color: var(--wrong);
  }

  .shake {
    animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  /* Buttons */
  .primary-btn {
    background-color: var(--accent);
    color: black;
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
    display: none; /* Hidden visually, but kept for logic if needed */
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
