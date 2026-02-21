<script>
  let { item } = $props();

  const summaryEn = $derived((item?.summary ?? item?.summary_en ?? "").slice(0, 400) + ((item?.summary ?? item?.summary_en ?? "").length > 400 ? "…" : ""));
  const summaryZhRaw = $derived((item?.summary_zh ?? "").trim());
  const summaryZh = $derived(summaryZhRaw ? summaryZhRaw.slice(0, 300) + (summaryZhRaw.length > 300 ? "…" : "") : "");
</script>

<a href={item?.url} target="_blank" rel="noopener" class="item-card">
  <div class="item-title">{item?.title ?? "—"}</div>
  <div class="item-meta">
    <span class="source-chip">{item?.source_name ?? "—"}</span>
    {#if item?.published_at}
      <span class="item-date">{new Date(item.published_at).toLocaleDateString()}</span>
    {/if}
  </div>
  {#if summaryEn}
    <div class="item-summary item-summary-en">{summaryEn}</div>
  {/if}
  {#if summaryZh}
    <div class="item-summary item-summary-zh">{summaryZh}</div>
  {:else}
    <div class="missing-zh">MISSING summary_zh</div>
  {/if}
</a>

<style>
  .item-card {
    display: block;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    color: inherit;
    transition: background 0.15s;
  }
  .item-card:hover { background: var(--surface-hover); }
  .item-card:last-child { border-bottom: none; }
  .item-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.35;
    margin-bottom: 0.3rem;
  }
  .item-meta { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem; }
  .source-chip {
    font-size: 0.5rem;
    padding: 0.1rem 0.35rem;
    background: rgba(var(--accent-rgb), 0.1);
    border-radius: 3px;
    text-transform: uppercase;
  }
  .item-date { font-size: 0.5rem; color: var(--text-muted); }
  .item-summary {
    font-size: 0.65rem;
    color: var(--text-secondary);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .item-summary-zh {
    color: var(--text-primary);
    margin-top: 0.2rem;
  }
  .missing-zh {
    margin-top: 0.2rem;
    font-size: 0.55rem;
    color: var(--danger);
  }
</style>
