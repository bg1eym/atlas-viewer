<script>
  let { runId, runMeta, mtime, coverageSources, configuredSources, verdict, pipelineVerdict, deliveryVerdict, deliveryReason, title = "ATLAS VIEWER" } = $props();

  const lastUpdated = $derived(mtime ? new Date(mtime).toLocaleString() : "—");
  const coverageText = $derived(
    coverageSources != null && configuredSources != null
      ? `${coverageSources}/${configuredSources}`
      : "—"
  );
  function displayVerdict(v) {
    const s = (v ?? "").toLowerCase();
    if (s === "pass") return "Verified";
    if (s === "ok") return "OK";
    if (s === "degraded") return "DEGRADED";
    if (s === "fail" || s === "blocked") return "Blocked";
    return "OK";
  }
  const pipelineV = pipelineVerdict ?? verdict;
  const verdictLabel = $derived(displayVerdict(pipelineV));
  const tgStatusText = $derived(
    !deliveryVerdict ? "" : deliveryVerdict === "OK" ? "TG: OK" : deliveryVerdict === "NOT_CONFIGURED" ? "TG: Not configured" : `TG: Blocked${deliveryReason ? ` (${deliveryReason})` : ""}`
  );

  function copyRunId() {
    if (runId && navigator.clipboard) {
      navigator.clipboard.writeText(runId);
    }
  }
</script>

<header class="header">
  <div class="header-left">
    <h1 class="logo">{title}</h1>
    <button class="run-id-btn" onclick={copyRunId} title="Copy run_id (hover to see)">
      <span class="copy-hint">📋</span>
    </button>
  </div>
  <div class="header-center">
    <span class="meta-item">Last updated: {lastUpdated}</span>
    <span class="meta-item">Items: {runMeta?.item_count ?? "—"}</span>
    <span class="meta-item">Coverage: {coverageText}</span>
    <span class="meta-item verdict verdict-{verdictLabel.toLowerCase().replace(/\s+/g, "-")}">{verdictLabel}</span>
    {#if tgStatusText}
      <span class="meta-item tg-status">{tgStatusText}</span>
    {/if}
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .header-left { display: flex; align-items: baseline; flex-shrink: 0; gap: 0.5rem; }
  .logo {
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-primary);
    margin: 0;
  }
  .run-id-btn {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 0.65rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .run-id-btn:hover { background: var(--border); color: var(--text-primary); }
  .run-id-btn code { font-size: 0.6rem; word-break: break-all; }
  .copy-hint { opacity: 0.7; }
  .header-center {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .meta-item {
    font-size: 0.6rem;
    color: var(--text-muted);
  }
  .verdict {
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-weight: 600;
  }
  .verdict-pass { background: rgba(68, 255, 136, 0.2); color: var(--success); }
  .verdict-fail { background: rgba(255, 68, 68, 0.2); color: var(--danger); }
  .verdict-ok { background: rgba(68, 255, 136, 0.2); color: var(--success); }
  .verdict-degraded { background: rgba(255, 170, 0, 0.2); color: var(--warning); }
  .verdict-unknown { background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); }
  .tg-status { font-size: 0.55rem; }
</style>
