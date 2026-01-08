<script lang="ts">
  import { onMount } from "svelte";
  import { fly, scale } from "svelte/transition";
  import confetti from "canvas-confetti";
  import gsap from "gsap";
  import { playSound } from "$lib";

  // Game Constants
  const RADIUS = 350;
  const CENTER_X = 400;
  const CENTER_Y = 380;

  // State
  let score = $state(0);
  let streak = $state(0);
  let highScore = $state(0);
  let targetAngle = $state(90);
  let userAngle = $state(90);
  let gameState = $state<"aiming" | "firing" | "hit" | "miss">("aiming");
  let projectile = $state({ x: CENTER_X, y: CENTER_Y, rotation: 0 });
  let feedback = $state("");

  // Derived State (Fixes the {@const} error)
  let tPos = $derived(getTargetPos(targetAngle));

  // Local Storage Key
  const STORAGE_KEY = "angle-archer-state";

  function saveState() {
    const data = { score, streak, highScore };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  onMount(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      score = data.score || 0;
      streak = data.streak || 0;
      highScore = data.highScore || 0;
    }
    newRound();
  });

  function newRound() {
    gameState = "aiming";
    feedback = "";
    // Random angle between 10 and 170
    targetAngle = Math.floor(Math.random() * 160) + 10;
    projectile = { x: CENTER_X, y: CENTER_Y, rotation: 0 };
  }

  function fire() {
    if (gameState !== "aiming") return;

    gameState = "firing";
    projectile.rotation = userAngle;
    playSound("pop");

    const rad = (userAngle * Math.PI) / 180;
    const endX = CENTER_X + RADIUS * Math.cos(-rad);
    const endY = CENTER_Y + RADIUS * Math.sin(-rad);

    gsap.to(projectile, {
      x: endX,
      y: endY,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        projectile = { ...projectile };
      },
      onComplete: checkHit,
    });
  }

  function checkHit() {
    const diff = Math.abs(targetAngle - userAngle);

    if (diff <= 5) {
      handleHit(diff);
    } else {
      handleMiss(diff);
    }
    saveState();
    setTimeout(newRound, 2000);
  }

  function handleHit(diff: number) {
    gameState = "hit";
    playSound("correct");

    const points = diff === 0 ? 50 : diff <= 2 ? 20 : 10;
    score += points;
    streak += 1;
    if (score > highScore) highScore = score;

    feedback = diff === 0 ? "BULLSEYE! Perfect!" : "Direct Hit!";

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  function handleMiss(diff: number) {
    gameState = "miss";
    playSound("wrong");
    streak = 0;

    feedback = diff < 10 ? "So Close!" : "Way off!";
    gsap.to(".game-svg", { x: 5, duration: 0.05, yoyo: true, repeat: 5 });
  }

  function getTargetPos(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: CENTER_X + RADIUS * Math.cos(-rad),
      y: CENTER_Y + RADIUS * Math.sin(-rad),
    };
  }
</script>

<div class="page-container">
  <div class="game-layout">
    <aside class="sidebar">
      <div class="panel">
        <h2>Stats</h2>
        <div class="stat-row">
          <span>Score</span>
          <span class="val">{score}</span>
        </div>
        <div class="stat-row">
          <span>High Score</span>
          <span class="val highlight">{highScore}</span>
        </div>
        <div class="stat-row">
          <span>Streak</span>
          <span class="val fire">{streak} 🔥</span>
        </div>
      </div>

      <div class="panel instructions">
        <h3>How to Play</h3>
        <p>Estimate the angle of the red target.</p>
        <p><strong>0°</strong> is Right (East)</p>
        <p><strong>90°</strong> is Up (North)</p>
        <p><strong>180°</strong> is Left (West)</p>
      </div>
    </aside>

    <main class="game-board">
      <div class="header">
        <h1>Angle Archer 🏹</h1>
        <p
          class="feedback-text"
          class:success={gameState === "hit"}
          class:fail={gameState === "miss"}
        >
          {feedback || "Estimate the angle..."}
        </p>
      </div>

      <div class="svg-container">
        <svg viewBox="0 0 800 450" class="game-svg">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
          </defs>

          <path
            d="M 50 {CENTER_Y} A {RADIUS} {RADIUS} 0 0 1 750 {CENTER_Y}"
            fill="none"
            stroke="#e2e8f0"
            stroke-width="2"
            stroke-dasharray="10 10"
          />
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2="750"
            y2={CENTER_Y}
            stroke="#e2e8f0"
            stroke-width="2"
          />
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2="50"
            y2={CENTER_Y}
            stroke="#e2e8f0"
            stroke-width="2"
          />
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={CENTER_X}
            y2={CENTER_Y - RADIUS}
            stroke="#e2e8f0"
            stroke-width="2"
          />

          <text x="760" y={CENTER_Y + 5} class="label">0°</text>
          <text
            x={CENTER_X}
            y={CENTER_Y - RADIUS - 10}
            class="label"
            text-anchor="middle">90°</text
          >
          <text x="40" y={CENTER_Y + 5} class="label" text-anchor="end"
            >180°</text
          >

          <circle
            cx={tPos.x}
            cy={tPos.y}
            r="15"
            fill="#ef4444"
            stroke="white"
            stroke-width="3"
            class="target"
          />
          <circle
            cx={tPos.x}
            cy={tPos.y}
            r="25"
            fill="none"
            stroke="#ef4444"
            stroke-opacity="0.5"
            class="pulse"
          />

          {#if gameState === "firing" || gameState === "hit" || gameState === "miss"}
            <line
              x1={projectile.x}
              y1={projectile.y}
              x2={projectile.x +
                20 * Math.cos(-((projectile.rotation * Math.PI) / 180))}
              y2={projectile.y +
                20 * Math.sin(-((projectile.rotation * Math.PI) / 180))}
              stroke="#3b82f6"
              stroke-width="4"
              marker-end="url(#arrowhead)"
            />
          {/if}

          <circle cx={CENTER_X} cy={CENTER_Y} r="20" fill="#1e293b" />

          <g transform="translate({CENTER_X}, {CENTER_Y}) rotate({-userAngle})">
            <rect x="0" y="-4" width="60" height="8" fill="#1e293b" rx="2" />
          </g>
        </svg>
      </div>

      <div class="controls">
        <div class="input-group">
          <label for="angle">Angle:</label>
          <input
            id="angle"
            type="range"
            min="0"
            max="180"
            bind:value={userAngle}
            disabled={gameState !== "aiming"}
          />
          <span class="angle-display">{userAngle}°</span>
        </div>

        <button
          class="fire-btn"
          onclick={fire}
          disabled={gameState !== "aiming"}
        >
          FIRE
        </button>
      </div>
    </main>
  </div>
</div>

<style>
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .game-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
    margin-top: 2rem;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .panel {
    background: var(--bg-panel, white);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--border, #eee);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .val {
    font-weight: bold;
    color: var(--accent, #3b82f6);
  }

  .val.highlight {
    color: #8b5cf6;
  }
  .val.fire {
    color: #f97316;
  }

  .game-board {
    background: var(--bg-panel, white);
    border-radius: 16px;
    padding: 2rem;
    border: 1px solid var(--border, #eee);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .header {
    text-align: center;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 2.5rem;
    margin: 0;
    background: linear-gradient(to right, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .feedback-text {
    height: 1.5rem;
    font-size: 1.25rem;
    font-weight: bold;
    color: #64748b;
  }

  .feedback-text.success {
    color: #22c55e;
  }
  .feedback-text.fail {
    color: #ef4444;
  }

  .svg-container {
    width: 100%;
    max-width: 800px;
    background: #f8fafc;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    overflow: hidden;
  }

  .label {
    font-family: monospace;
    font-size: 14px;
    fill: #64748b;
  }

  .pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .controls {
    margin-top: 2rem;
    display: flex;
    gap: 2rem;
    align-items: center;
    width: 100%;
    max-width: 600px;
  }

  .input-group {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
  }

  input[type="range"] {
    flex: 1;
    height: 8px;
    cursor: pointer;
  }

  .angle-display {
    background: #1e293b;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    min-width: 3ch;
    text-align: center;
  }

  .fire-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 1rem 3rem;
    font-size: 1.5rem;
    font-weight: 900;
    border-radius: 8px;
    cursor: pointer;
    transition:
      transform 0.1s,
      background 0.2s;
    box-shadow: 0 4px 0 #b91c1c;
  }

  .fire-btn:active {
    transform: translateY(4px);
    box-shadow: none;
  }

  .fire-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    .game-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
