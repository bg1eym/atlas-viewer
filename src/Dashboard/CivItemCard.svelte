<script>
  let { item } = $props();

  const score5d = $derived(item?.score_5d ?? { compute: 0, governance: 0, narrative: 0, behavior: 0, capability: 0 });
  const dots = $derived([
    score5d.compute,
    score5d.governance,
    score5d.narrative,
    score5d.behavior,
    score5d.capability,
  ]);
  const summaryEn = $derived((item?.summary ?? item?.summary_en ?? "").slice(0, 150) + ((item?.summary ?? item?.summary_en ?? "").length > 150 ? "…" : ""));
  const summaryZhRaw = $derived((item?.summary_zh ?? "").trim());
  const summaryZh = $derived(summaryZhRaw ? summaryZhRaw.slice(0, 150) + (summaryZhRaw.length > 150 ? "…" : "") : "");
</script>

<a href={item?.url} target="_blank" rel="noopener" class="civ-item-card">
  <div class="item-title">{item?.title ?? "—"}</div>
  <div class="item-meta">
    <span class="source-chip">{item?.source_name ?? "—"}</span>
    {#if item?.score_total != null}
      <span class="score-badge">{item.score_total}</span>
    {/if}
    {#if item?.published_at}
      <span class="item-date">{new Date(item.published_at).toLocaleDateString()}</span>
    {/if}
  </div>
  <div class="five-d-dots" title="5D: compute, governance, narrative, behavior, capability">
    {#each dots as d}
      <span class="dot" class:filled={d >= 1}>{d >= 2 ? "●" : d >= 1 ? "○" : "·"}</span>
    {/each}
  </div>
  {#if summaryEn}
    <div class="item-summary item-summary-en">{summaryEn}</div>
  {/if}
  {#if summaryZh}
    <div class="item-summary-zh">{summaryZh}</div>
  {:else}
    <div class="missing-zh">MISSING summary_zh</div>
  {/if}
</a>

<style>
  .civ-item-card {
    display: block;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    color: inherit;
    transition: background 0.15s;
  }
  .civ-item-card:hover { background: var(--surface-hover); }
  .civ-item-card:last-child { border-bottom: none; }
  .item-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    margin-bottom: 0.25rem;
  }
  .item-meta { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.2rem; flex-wrap: wrap; }
  .source-chip {
    font-size: 0.5rem;
    padding: 0.1rem 0.35rem;
    background: rgba(var(--accent-rgb), 0.1);
    border-radius: 3px;
    text-transform: uppercase;
  }
  .score-badge {
    font-size: 0.5rem;
    padding: 0.1rem 0.35rem;
    background: rgba(255, 170, 0, 0.2);
    border-radius: 3px;
    font-weight: 600;
  }
  .item-date { font-size: 0.5rem; color: var(--text-muted); }
  .five-d-dots {
    display: flex;
    gap: 0.15rem;
    font-size: 0.5rem;
    margin-bottom: 0.2rem;
  }
  .dot { color: var(--text-muted); opacity: 0.5; }
  .dot.filled { opacity: 1; color: var(--accent); }
  .item-summary, .item-summary-zh {
    font-size: 0.55rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }
  .missing-zh {
    margin-top: 0.2rem;
    font-size: 0.55rem;
    color: var(--danger);
  }
</style>
