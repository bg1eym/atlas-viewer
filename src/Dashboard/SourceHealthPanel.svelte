<script>
  let { coverage = [], onSourceClick, sourceIdToName = {} } = $props();
</script>

<div class="source-health">
  {#each coverage as c (c.source_id)}
    <button
      type="button"
      class="source-card status-{c.status ?? 'unknown'}"
      onclick={() => onSourceClick?.(c.source_id, c.source_name ?? sourceIdToName[c.source_id] ?? c.source_id)}
    >
      <div class="source-name">{c.source_name ?? sourceIdToName[c.source_id] ?? c.source_id}</div>
      <div class="source-id">{c.source_id}</div>
      <div class="source-meta">
        <span class="status-badge">{c.status ?? "—"}</span>
        <span class="item-count">{c.item_count ?? 0} items</span>
      </div>
      {#if c.reason}
        <div class="source-reason">{c.reason}</div>
      {/if}
    </button>
  {/each}
  {#if coverage.length === 0}
    <div class="empty">No coverage data</div>
  {/if}
</div>

<style>
  .source-health {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.35rem;
  }
  .source-card {
    text-align: left;
    padding: 0.4rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .source-card:hover { background: var(--surface-hover); }
  .source-card.status-ok { border-left: 3px solid var(--success); }
  .source-card.status-empty { border-left: 3px solid var(--warning); }
  .source-card:not(.status-ok):not(.status-empty) { border-left: 3px solid var(--danger); }
  .source-name { font-size: 0.6rem; font-weight: 600; color: var(--text-primary); }
  .source-id { font-size: 0.48rem; color: var(--text-muted); margin-top: 0.1rem; }
  .source-meta { font-size: 0.5rem; color: var(--text-muted); margin-top: 0.2rem; display: flex; gap: 0.5rem; }
  .status-badge { text-transform: uppercase; }
  .source-reason { font-size: 0.5rem; color: var(--danger); margin-top: 0.2rem; }
  .empty { font-size: 0.65rem; color: var(--text-muted); padding: 1rem; text-align: center; }
</style>
