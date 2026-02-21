<script>
  let {
    itemCount,
    coverageStats,
    aiRejectCount,
    structuralCount = null,
    topCivTag = null,
    topCivCount = null,
  } = $props();
</script>

<div class="kpi-cards" data-testid="kpi-cards">
  <div class="kpi-card">
    <div class="kpi-label">Item count</div>
    <div class="kpi-value">{itemCount ?? 0}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Structural (≥7)</div>
    <div class="kpi-value">{structuralCount ?? 0}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Top civ tag</div>
    <div class="kpi-value">{topCivTag ?? "—"} ({topCivCount ?? 0})</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Sources</div>
    <div class="kpi-value">
      {#if coverageStats}
        OK {coverageStats.ok ?? 0} · Empty {coverageStats.empty ?? 0} · Rate-limited {coverageStats.rate_limited ?? 0} · Errors {coverageStats.error ?? 0}
      {:else}
        —
      {/if}
    </div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">AI-only reject</div>
    <div class="kpi-value">{aiRejectCount ?? 0}</div>
  </div>
</div>

<style>
  .kpi-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
  }
  .kpi-card {
    text-align: center;
    padding: 0.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
  }
  .kpi-label {
    font-size: 0.5rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 0.2rem;
  }
  .kpi-value {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    word-break: break-word;
  }
  .kpi-sub {
    font-size: 0.55rem;
    color: var(--text-secondary);
    margin-top: 0.1rem;
  }
  .kpi-sub.over { color: var(--danger); }
</style>
