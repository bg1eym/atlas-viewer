<script>
  let { selectedCategory = null, coverage = [], onSourceClick, onKolClick } = $props();

  function sortEditorial(a, b) {
    const w = (b.editorial_weight ?? 0) - (a.editorial_weight ?? 0);
    if (w !== 0) return w;
    const f = (b.freshness_ts ?? 0) - (a.freshness_ts ?? 0);
    if (f !== 0) return f;
    const r = (b.ok_rate ?? 0) - (a.ok_rate ?? 0);
    if (r !== 0) return r;
    return (a.source_name ?? a.source_id ?? "").localeCompare(b.source_name ?? b.source_id ?? "");
  }

  const sources = $derived.by(() =>
    coverage
      .filter((c) => !selectedCategory || c.category === selectedCategory)
      .filter((c) => (c.kind ?? "unknown") !== "kol")
      .slice()
      .sort(sortEditorial)
  );

  const kols = $derived.by(() =>
    coverage
      .filter((c) => !selectedCategory || c.category === selectedCategory)
      .filter((c) => (c.kind ?? "unknown") === "kol")
      .slice()
      .sort(sortEditorial)
  );
</script>

<div class="sources-kol-panel" data-testid="sources-kol-panel">
  <h3 class="panel-title">Sources & KOL</h3>
  {#if selectedCategory}
    <div class="sources-section">
      <h4 class="subtitle">Sources</h4>
      <ul class="chip-list interactive">
        {#each sources as s}
          <li>
            <button
              type="button"
              class="chip source-chip"
              class:status-ok={s.status === "ok"}
              class:status-empty={s.status === "empty"}
              class:status-error={s.status !== "ok" && s.status !== "empty"}
              onclick={() => onSourceClick?.(s.source_id, s.source_name ?? s.source_id)}
            >
              {s.source_name ?? s.source_id}
              <span class="chip-meta">
                {s.item_count ?? 0} items · {s.status ?? "unknown"} · w={s.editorial_weight ?? 0}
              </span>
              {#if s.reason}
                <span class="chip-reason">{s.reason}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
    <div class="kols-section">
      <h4 class="subtitle">KOL</h4>
      <ul class="chip-list interactive">
        {#each kols as k}
          <li>
            <button type="button" class="chip kol" onclick={() => (onKolClick?.(k.source_id, k.source_name ?? k.source_id), onSourceClick?.(k.source_id, k.source_name ?? k.source_id))}>
              {k.source_name ?? k.source_id}
              <span class="chip-meta">{k.status ?? "unknown"}</span>
              {#if k.reason}
                <span class="chip-reason">{k.reason}</span>
              {/if}
              {#if k.kol_profile?.fallback_signal_sources?.length}
                <span class="chip-fallbacks">
                  Fallback:
                  {#each k.kol_profile.fallback_signal_sources as f, i}
                    <a href={f.url} target="_blank" rel="noopener">{f.label}</a>{i < k.kol_profile.fallback_signal_sources.length - 1 ? ", " : ""}
                  {/each}
                </span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="hint">Select a category</p>
  {/if}
</div>

<style>
  .sources-kol-panel { padding: 0.5rem; }
  .panel-title {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
  }
  .subtitle { font-size: 0.6rem; margin: 0.5rem 0 0.25rem 0; color: var(--text-muted); }
  .chip-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .chip-list.interactive .chip { cursor: pointer; }
  .chip {
    font-size: 0.55rem;
    padding: 0.15rem 0.4rem;
    background: rgba(var(--accent-rgb), 0.1);
    border-radius: 3px;
    border: 1px solid transparent;
    text-align: left;
  }
  .chip:hover { background: rgba(var(--accent-rgb), 0.2); }
  .chip.kol { background: rgba(255, 170, 0, 0.15); }
  .chip.kol:hover { background: rgba(255, 170, 0, 0.25); }
  .chip.status-ok { border-left: 3px solid var(--success); }
  .chip.status-empty { border-left: 3px solid var(--warning); }
  .chip.status-error { border-left: 3px solid var(--danger); }
  .chip-meta { font-size: 0.5rem; color: var(--text-muted); margin-left: 0.25rem; display: block; }
  .chip-reason { display: block; font-size: 0.5rem; color: var(--danger); margin-top: 0.15rem; max-width: 260px; }
  .chip-fallbacks { display: block; font-size: 0.5rem; color: var(--text-muted); margin-top: 0.15rem; }
  .chip-fallbacks a { color: var(--text-primary); text-decoration: underline; }
  .hint { font-size: 0.65rem; color: var(--text-muted); padding: 1rem; }
</style>
