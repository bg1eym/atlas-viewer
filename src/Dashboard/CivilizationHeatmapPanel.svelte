<script>
  let { structuralCountByTag = {}, structuralCount = 0, onTagClick } = $props();

  const CIV_TAGS = [
    "Vinge/Compute",
    "Banks/Governance",
    "Antimemetics",
    "TedChiang/Language",
    "Egan",
    "Watts",
    "Simulation",
    "Religion/Meaning",
  ];

  const rows = $derived(
    CIV_TAGS.map((tag) => ({
      tag,
      count: structuralCountByTag[tag] ?? 0,
    }))
  );

  const maxCount = $derived(Math.max(1, ...rows.map((r) => r.count)));
</script>

<div class="civ-heatmap" data-testid="civilization-panel">
  <div class="heatmap-bars">
    {#each rows as { tag, count }}
      <button
        type="button"
        class="bar-row"
        onclick={() => onTagClick?.(tag)}
      >
        <span class="bar-label">{tag}</span>
        <div class="bar-track">
          <div
            class="bar-fill"
            style="height: {(count / maxCount) * 100}%"
          ></div>
        </div>
        <span class="bar-value">{count}</span>
      </button>
    {/each}
  </div>
  {#if structuralCount > 0}
    <div class="structural-hint">Structural (score≥7): {structuralCount}</div>
  {/if}
</div>

<style>
  .civ-heatmap { display: flex; flex-direction: column; gap: 0.35rem; }
  .heatmap-bars { display: flex; flex-direction: column; gap: 0.25rem; }
  .bar-row {
    display: grid;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0.2rem 0;
    grid-template-columns: 140px 1fr 36px;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.6rem;
  }
  .bar-row:hover .bar-fill { opacity: 1; }
  .bar-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-secondary);
    font-size: 0.55rem;
  }
  .bar-track {
    height: 16px;
    min-width: 60px;
    background: var(--border);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }
  .bar-fill {
    width: 100%;
    min-height: 2px;
    background: var(--accent);
    opacity: 0.7;
    border-radius: 2px;
    transition: height 0.2s, opacity 0.15s;
  }
  .bar-value { font-variant-numeric: tabular-nums; color: var(--text-muted); text-align: right; }
  .structural-hint { font-size: 0.5rem; color: var(--text-muted); margin-top: 0.25rem; }
</style>
