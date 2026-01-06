<script lang="ts">
  type Props = {
    countDirection?: "up" | "down";
    delay?: number;
    duration: number;
    startTime?: number;
  };

  let {
    countDirection = "down",
    delay = 0,
    duration,
    startTime = 0,
  } = $props() as Props;

  let initialCount = $derived(
    countDirection === "down" && startTime === 0 ? duration : startTime,
  );

  let count = $state(initialCount);
  let isRunning = $state(false);
  let isDelaying = $state(false);
  let interval: number | undefined;
  let timeout: number | undefined;

  // TIE ANIMATION TO COUNT: Calculate width based on progress
  let progressWidth = $derived((count / duration) * 100);

  // Format count into MM:SS display
  const timeDisplay = $derived(() => {
    const mins = Math.floor(count / 60);
    const secs = count % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  });

  $effect(() => {
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  });

  function updateCounter() {
    if (countDirection === "down") {
      if (count > 0) count -= 1;
      else pause();
    } else {
      if (count < duration) count += 1;
      else pause();
    }
  }

  function start() {
    isRunning = true;
    interval = setInterval(updateCounter, 1000) as unknown as number;
  }

  function pause() {
    isRunning = false;
    isDelaying = false;
    clearInterval(interval);
    clearTimeout(timeout);
  }

  function handlePlayPause() {
    if (isRunning || isDelaying) {
      pause();
    } else {
      if (delay > 0 && count === initialCount) {
        isDelaying = true;
        timeout = setTimeout(() => {
          isDelaying = false;
          start();
        }, delay * 1000) as unknown as number;
      } else {
        start();
      }
    }
  }

  function handleReset() {
    pause();
    count = initialCount;
  }
</script>

<div class="pill-timer">
  <div class="timer-animation" style="width: {progressWidth}%"></div>

  <div class="controls">
    <button
      class="btn play-pause"
      onclick={handlePlayPause}
      aria-label="Play/Pause"
    >
      {#if isRunning || isDelaying}
        <svg viewBox="0 0 24 24" fill="currentColor"
          ><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg
        >
      {:else}
        <svg viewBox="0 0 24 24" fill="currentColor"
          ><path d="M8 5v14l11-7z" /></svg
        >
      {/if}
    </button>
    <button class="btn reset" onclick={handleReset} aria-label="Reset">
      <svg viewBox="0 0 24 24" fill="currentColor"
        ><path
          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        /></svg
      >
    </button>
  </div>

  <div class="info">
    <span class="label">Timer</span>
    <span class="time">{timeDisplay()}</span>
  </div>
</div>

<style>
  :root {
    --timer-orange: #f8a13f;
    --timer-bg: #000000;
    --btn-gray: #333333;
    --btn-orange-bg: #4a2d12;
  }

  .pill-timer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0.5rem 0.25rem;
    background-color: var(--timer-bg);
    border-radius: 999px;
    padding: 12px 32px 12px 16px;
    gap: 1rem;
    position: relative;
    overflow: hidden;
    color: var(--timer-orange);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .controls {
    display: flex;
    gap: 12px;
  }

  .btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.1s;
  }

  .btn:active {
    transform: scale(0.9);
  }

  .btn svg {
    width: 20px;
    height: 20px;
  }

  .btn.play-pause {
    background-color: var(--btn-orange-bg);
    color: var(--timer-orange);
  }

  .btn.reset {
    background-color: var(--btn-gray);
    color: #ffffff;
  }

  .info {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .label {
    font-size: 1.2rem;
    font-weight: 500;
  }

  .time {
    font-size: 4rem;
    font-weight: 300;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .timer-animation {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    background-color: var(--timer-orange);
    /* Transition ensures smooth movement as count updates */
    transition: width 1s linear;
  }
</style>
