<script>
  let { runs = [], selectedRunId = null, onSelect, onRefresh } = $props();

  function formatDate(ms) {
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function displayVerdict(v) {
    const s = (v ?? "").toLowerCase();
    if (s === "pass") return "Verified";
    if (s === "ok") return "OK";
    if (s === "degraded") return "DEGRADED";
    if (s === "fail" || s === "blocked") return "Blocked";
    return "OK";
  }
  function displayPipelineLabel(v) {
    if (!v || v === "unknown") return "NO_AUDIT";
    return displayVerdict(v);
  }
  function displayDeliveryLabel(v, reason) {
    if (!v) return "TG_NOT_CONFIGURED";
    const s = (v ?? "").toLowerCase();
    if (s === "ok") return "TG: OK";
    if (s === "not_configured") return "TG: Not configured";
    if (s === "blocked") return reason ? `TG: Blocked (${reason})` : "TG: Blocked";
    return `TG: ${v}`;
  }
  function verdictHint(v) {
    const s = (v ?? "").toLowerCase();
    if (s === "blocked") return "BLOCKED: total_sources=0 或全部不可用并有明确原因";
    if (s === "degraded") return "DEGRADED: 可用但低于阈值";
    return "OK: 有可用来源并满足基本阈值";
  }
</script>

<div class="run-browser">
  <button class="refresh" onclick={onRefresh}>↻ Refresh</button>
  <ul class="run-list" role="list">
    {#each runs as run (run.run_id)}
      <li>
        <button
          type="button"
          class="run-item"
          class:selected={selectedRunId === run.run_id}
          onclick={() => onSelect(run.run_id)}
        >
          <span class="run-date">{formatDate(run.mtime)}</span>
          <span class="run-meta">
            {run.item_count ?? 0} items · {(run.coverage_sources != null && run.configured_sources != null)
              ? `${run.coverage_sources}/${run.configured_sources}`
              : "—"} coverage
          </span>
          <span class="verdict verdict-{displayPipelineLabel(run.pipeline_verdict ?? run.verdict).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-")}" title={verdictHint(run.pipeline_verdict ?? run.verdict)}>{displayPipelineLabel(run.pipeline_verdict ?? run.verdict)}</span>
          <span class="tg-status" title={run.delivery_reason ?? ""}>
            {displayDeliveryLabel(run.delivery_verdict, run.delivery_reason)}
          </span>
          <span class="run-id-hover" title={run.run_id}>📋</span>
        </button>
      </li>
    {/each}
  </ul>
  {#if runs.length === 0}
    <p class="no-runs">No runs in out/atlas/</p>
  {/if}
</div>

<style>
  .run-browser {
    padding: 0.5rem;
  }
  .refresh {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-primary);
    border-radius: 4px;
    font-size: 0.7rem;
  }
  .refresh:hover {
    background: var(--surface-hover);
  }
  .run-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .run-list li {
    list-style: none;
  }
  .run-item {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 0.25rem;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid transparent;
    background: var(--surface);
    color: var(--text-primary);
    text-align: left;
    font-size: 0.75rem;
  }
  .run-item:hover {
    background: var(--surface-hover);
  }
  .run-item.selected {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--accent);
  }
  .run-date {
    display: block;
    font-weight: 600;
    font-size: 0.75rem;
  }
  .run-meta {
    font-size: 0.65rem;
    color: var(--text-secondary);
  }
  .run-id-hover {
    font-size: 0.65rem;
    opacity: 0.6;
    cursor: help;
  }
  .tg-status {
    font-size: 0.55rem;
    color: var(--text-muted);
    display: block;
    margin-top: 0.1rem;
  }
  .verdict {
    display: inline-block;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    font-size: 0.6rem;
    margin-top: 0.2rem;
  }
  .verdict-verified, .verdict-pass {
    background: #d4edda;
    color: #155724;
  }
  .verdict-fail {
    background: #f8d7da;
    color: #721c24;
  }
  .verdict-blocked {
    background: #fff3cd;
    color: #856404;
  }
  .verdict-live-run {
    background: rgba(var(--accent-rgb), 0.1);
    color: var(--text-secondary);
  }
  .verdict-ok {
    background: rgba(68, 255, 136, 0.15);
    color: #155724;
  }
  .verdict-degraded {
    background: #fff3cd;
    color: #856404;
  }
  .verdict-no-audit {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-muted);
  }
  .no-runs {
    padding: 1rem;
    color: var(--text-muted);
    font-size: 0.8rem;
  }
</style>
