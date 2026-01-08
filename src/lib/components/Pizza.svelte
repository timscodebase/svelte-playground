<script lang="ts">
  const VIEWBOX_SIZE = 200;
  const CENTER = VIEWBOX_SIZE / 2;
  const RADIUS = 90;

  let {
    denominator,
    numerator = 0,
    selectedIndices = null /* New prop for specific slice selection */,
    interactive = false,
    onclick = (i: number) => {},
  } = $props();
</script>

<div class="pizza-wrapper">
  <svg viewBox="0 0 {VIEWBOX_SIZE} {VIEWBOX_SIZE}">
    <circle cx={CENTER} cy={CENTER} r={RADIUS + 4} fill="#eab308" />
    {#each Array(denominator) as _, i}
      {@const isSelected = selectedIndices
        ? selectedIndices.includes(i)
        : i < numerator}

      <path
        d={(() => {
          const anglePerSlice = (2 * Math.PI) / denominator;
          const startAngle = i * anglePerSlice - Math.PI / 2;
          const endAngle = (i + 1) * anglePerSlice - Math.PI / 2;
          const x1 = CENTER + RADIUS * Math.cos(startAngle);
          const y1 = CENTER + RADIUS * Math.sin(startAngle);
          const x2 = CENTER + RADIUS * Math.cos(endAngle);
          const y2 = CENTER + RADIUS * Math.sin(endAngle);
          const largeArcFlag = anglePerSlice > Math.PI ? 1 : 0;
          return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        })()}
        class="slice"
        class:selected={isSelected}
        class:interactive
        onclick={() => interactive && onclick(i)}
        fill={isSelected ? "#ef4444" : "#fef08a"}
        stroke="#b45309"
        stroke-width="2"
      />
    {/each}
  </svg>
</div>

<style>
  .pizza-wrapper {
    width: 200px;
    height: 200px;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .slice.interactive {
    cursor: pointer;
  }
  .slice.interactive:hover {
    filter: brightness(1.05);
  }
</style>
