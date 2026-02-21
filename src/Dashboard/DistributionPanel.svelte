<script>
  let { items = [], coverage = [], onSourceClick } = $props();

  const bySource = $derived.by(() => {
    const map = {};
    for (const i of items) {
      const s = i.source_name ?? "unknown";
      map[s] = (map[s] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  });

  const maxCount = $derived(bySource.length ? Math.max(...bySource.map(([, c]) => c)) : 1);
</script>

<div class="distribution">
  {#each bySource as [source, count]}
    <button type="button" class="bar-row" onclick={() => onSourceClick?.(source)}>
      <span class="bar-label">{source}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width: {(count / maxCount) * 100}%"></div>
      </div>
      <span class="bar-value">{count}</span>
    </button>
  {/each}
  {#if bySource.length === 0}
    <div class="empty">No items to distribute</div>
  {/if}
</div>

<style>
  .distribution { display: flex; flex-direction: column; gap: 0.35rem; }
  .bar-row {
    display: grid;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0.2rem 0;
    grid-template-columns: 120px 1fr 40px;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.6rem;
  }
  .bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary); }
  .bar-track {
    height: 8px;
    background: var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: var(--accent);
    opacity: 0.6;
    border-radius: 4px;
    transition: width 0.2s;
  }
  .bar-value { font-variant-numeric: tabular-nums; color: var(--text-muted); text-align: right; }
  .empty { font-size: 0.65rem; color: var(--text-muted); padding: 1rem; text-align: center; }
</style>
