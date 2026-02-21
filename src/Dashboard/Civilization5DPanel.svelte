<script>
  let { avgScoreByTag = {} } = $props();

  const AXES = ["compute", "governance", "narrative", "behavior", "capability"];
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
    CIV_TAGS.filter((tag) => (avgScoreByTag[tag] ?? 0) > 0).map((tag) => ({
      tag,
      avg: avgScoreByTag[tag] ?? 0,
    }))
  );

  const maxAvg = $derived(Math.max(0.1, ...rows.map((r) => r.avg)));
</script>

<div class="civ-5d">
  <div class="axis-labels">
    <span class="axis-label">5D avg</span>
  </div>
  <div class="bars-grid">
    {#each rows as { tag, avg }}
      <div class="bar-cell">
        <span class="cell-tag">{tag}</span>
        <div class="cell-bar-track">
          <div
            class="cell-bar-fill"
            style="width: {(avg / maxAvg) * 100}%"
          ></div>
        </div>
        <span class="cell-value">{avg.toFixed(1)}</span>
      </div>
    {/each}
  </div>
  {#if rows.length === 0}
    <div class="empty">No 5D scores yet</div>
  {/if}
</div>

<style>
  .civ-5d { display: flex; flex-direction: column; gap: 0.35rem; }
  .axis-labels { font-size: 0.5rem; color: var(--text-muted); }
  .bars-grid { display: flex; flex-direction: column; gap: 0.25rem; }
  .bar-cell {
    display: grid;
    grid-template-columns: 120px 1fr 32px;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.55rem;
  }
  .cell-tag {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-secondary);
  }
  .cell-bar-track {
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }
  .cell-bar-fill {
    height: 100%;
    background: var(--accent);
    opacity: 0.6;
    border-radius: 3px;
    transition: width 0.2s;
  }
  .cell-value { font-variant-numeric: tabular-nums; color: var(--text-muted); text-align: right; }
  .empty { font-size: 0.65rem; color: var(--text-muted); padding: 1rem; text-align: center; }
</style>
