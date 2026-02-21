<script>
  import { fetchJsonOrNull, fetchTextOrNull, fetchTextWithMeta, fetchWithMeta } from "./api.js";
  import { getRunDataBase } from "./config.js";

  let { runId, debugMode = false, debugInfo = {}, onDebugUpdate } = $props();

  let renderMeta = $state(null);
  let provenance = $state(null);
  let acceptanceReport = $state(null);
  let renderedText = $state(null);
  let renderedTextRoutingError = $state(null);
  let items = $state([]);
  let sourcesRaw = $state(null);
  let auditSummary = $state(null);
  let tgProvenance = $state(null);
  let tgSent = $state(null);
  let tgReadback = $state(null);
  let activeTab = $state("summary");
  let searchQuery = $state("");
  let sourceFilter = $state("");
  let selectedItem = $state(null);
  let visibleCount = $state(100);

  const TG_LIMIT = 4096;
  const PAGE_SIZE = 100;

  async function loadRun() {
    if (!runId) return;
    const base = getRunDataBase(runId);
    renderedTextRoutingError = null;
    try {
      const renderedUrl = `${base}/rendered_text.txt`;
      const renderMetaUrl = `${base}/render_meta.json`;
      let rm, rtMeta;
      if (debugMode && onDebugUpdate) {
        const [metaRm, metaRt] = await Promise.all([
          fetchWithMeta(renderMetaUrl, { as: "json" }),
          fetchTextWithMeta(renderedUrl),
        ]);
        rm = metaRm?.data ?? null;
        rtMeta = metaRt;
        if (metaRm) onDebugUpdate("render_meta", { url: metaRm.url, status: metaRm.status, contentType: metaRm.contentType, bodyPreview: metaRm.bodyPreview });
        if (metaRt) onDebugUpdate("rendered_text", { url: metaRt.url, status: metaRt.status, contentType: metaRt.contentType, bodyPreview: metaRt.bodyPreview });
      } else {
        [rm, rtMeta] = await Promise.all([
          fetchJsonOrNull(renderMetaUrl),
          fetchTextWithMeta(renderedUrl),
        ]);
      }
      renderMeta = rm;
      if (rtMeta) {
        const isJsonLike = (rtMeta.contentType || "").toLowerCase().includes("application/json") ||
          (rtMeta.text.length > 0 && rtMeta.text.trimStart()[0] === "{");
        if (isJsonLike) {
          renderedTextRoutingError = {
            url: renderedUrl,
            preview: rtMeta.text.slice(0, 80),
          };
          renderedText = "";
        } else {
          renderedText = rtMeta.text;
        }
      } else {
        renderedText = "";
      }

      // Optional files - never throw
      const [pv, acc, it, sr, aud, tgp, tgs, tgr] = await Promise.all([
        fetchJsonOrNull(`${base}/atlas-fetch/provenance.json`),
        fetchJsonOrNull(`${base}/acceptance_report.json`),
        fetchJsonOrNull(`${base}/atlas-fetch/items_normalized.json`),
        fetchJsonOrNull(`${base}/atlas-fetch/sources_raw.json`),
        fetchJsonOrNull(`${base}/audit/summary.json`),
        fetchJsonOrNull(`${base}/tg/provenance.json`),
        fetchTextOrNull(`${base}/tg/sent_text.txt`),
        fetchTextOrNull(`${base}/tg/readback_text.txt`),
      ]);
      provenance = pv;
      acceptanceReport = acc;
      items = it?.items ?? [];
      sourcesRaw = sr;
      auditSummary = aud;
      tgProvenance = tgp;
      tgSent = tgs;
      tgReadback = tgr;
    } catch (e) {
      console.error(e);
    }
  }

  $effect(() => {
    runId;
    loadRun();
  });

  $effect(() => {
    searchQuery;
    sourceFilter;
    visibleCount = PAGE_SIZE;
  });

  function loadMore() {
    visibleCount += PAGE_SIZE;
  }

  const filteredItems = $derived.by(() => {
    let list = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          (i.title ?? "").toLowerCase().includes(q) ||
          (i.source_name ?? "").toLowerCase().includes(q)
      );
    }
    if (sourceFilter) {
      list = list.filter((i) => (i.source_name ?? "") === sourceFilter);
    }
    return list;
  });

  const displayedItems = $derived(filteredItems.slice(0, visibleCount));
  const hasMore = $derived(filteredItems.length > visibleCount);

  const sources = $derived([...new Set(items.map((i) => i.source_name).filter(Boolean))].sort());

  const charCount = $derived(renderedText?.length ?? 0);
  const tgLimitRisk = $derived(charCount > TG_LIMIT);
</script>

<div class="overview">
  {#if renderedTextRoutingError}
    <div class="error-banner" role="alert">
      <strong>API routing error:</strong> rendered_text endpoint returned JSON (likely runs list).
      <br />
      <small>URL: {renderedTextRoutingError.url}</small>
      <br />
      <small>Response preview: {renderedTextRoutingError.preview}…</small>
    </div>
  {/if}
  <div class="tabs">
    <button class:active={activeTab === "summary"} onclick={() => (activeTab = "summary")}>
      Summary
    </button>
    <button class:active={activeTab === "rendered"} onclick={() => (activeTab = "rendered")}>
      Rendered
    </button>
    <button class:active={activeTab === "items"} onclick={() => (activeTab = "items")}>
      Items ({items.length})
    </button>
    <button class:active={activeTab === "sources"} onclick={() => (activeTab = "sources")}>
      Sources Raw
    </button>
    <button class:active={activeTab === "audit"} onclick={() => (activeTab = "audit")}>
      Audit / TG
    </button>
  </div>

  {#if activeTab === "summary"}
    <div class="cards">
      {#if !acceptanceReport && !auditSummary}
        <div class="callout callout-info">
          No acceptance/audit for this run (normal for non-acceptance runs).
        </div>
      {/if}
      <section class="card">
        <h2>Summary</h2>
        <dl>
          <dt>run_id</dt>
          <dd>{runId}</dd>
          <dt>item_count</dt>
          <dd>{renderMeta?.item_count ?? "—"}</dd>
          <dt>coverage</dt>
          <dd>
            {#if provenance?.coverage}
              <table class="coverage-table">
                <thead>
                  <tr>
                    <th>source</th>
                    <th>status</th>
                    <th>count</th>
                    <th>reason</th>
                  </tr>
                </thead>
                <tbody>
                  {#each provenance.coverage as c}
                    <tr>
                      <td>{c.source_id}</td>
                      <td><span class="status status-{c.status}">{c.status}</span></td>
                      <td>{c.item_count ?? 0}</td>
                      <td>{c.reason ?? "—"}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              —
            {/if}
          </dd>
          {#if acceptanceReport?.gates}
            <dt>gates</dt>
            <dd>
              <pre>{JSON.stringify(acceptanceReport.gates, null, 2)}</pre>
            </dd>
          {/if}
        </dl>
      </section>
      <section class="card">
        <h2>Provenance</h2>
        {#if provenance}
          <dl>
            <dt>pipeline_output_sha256</dt>
            <dd><code>{provenance.pipeline_output_sha256 ?? "—"}</code></dd>
            <dt>render_input_sha256</dt>
            <dd><code>{provenance.render_input_sha256 ?? "—"}</code></dd>
            <dt>timestamp</dt>
            <dd>{provenance.timestamp ?? "—"}</dd>
          </dl>
        {/if}
        {#if tgProvenance}
          <h3>TG Provenance</h3>
          <dl>
            <dt>rendered_sha256</dt>
            <dd><code>{tgProvenance.rendered_sha256 ?? "—"}</code></dd>
            <dt>sent_sha256</dt>
            <dd><code>{tgProvenance.sent_sha256 ?? "—"}</code></dd>
            <dt>readback_sha256</dt>
            <dd><code>{tgProvenance.readback_sha256 ?? "—"}</code></dd>
            <dt>chain_valid</dt>
            <dd>{tgProvenance.chain_valid ? "✓" : "✗"}</dd>
          </dl>
        {/if}
      </section>
    </div>
  {:else if activeTab === "rendered"}
    <section class="card">
      <h2>Rendered (TG Preview)</h2>
      <div class="meta">
        <span>Chars: {charCount}</span>
        {#if tgLimitRisk}
          <span class="warn">⚠ Over TG limit (4096)</span>
        {:else}
          <span class="ok">✓ Within TG limit</span>
        {/if}
      </div>
      <pre class="rendered">{renderedText ?? "(empty)"}</pre>
    </section>
  {:else if activeTab === "items"}
    <section class="card">
      <h2>Items</h2>
      {#if items.length === 0}
        <p class="callout callout-info">Items not found</p>
      {:else}
      <div class="filters">
        <input
          type="text"
          placeholder="Search title, source..."
          bind:value={searchQuery}
        />
        <select bind:value={sourceFilter}>
          <option value="">All sources</option>
          {#each sources as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
      </div>
      <div class="items-container" role="region" aria-label="Items table">
        <table class="items-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Source</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {#each displayedItems as item (item.id)}
              <tr
                class="item-row"
                class:selected={selectedItem?.id === item.id}
                onclick={() => (selectedItem = selectedItem?.id === item.id ? null : item)}
              >
                <td class="title">{item.title ?? "—"}</td>
                <td>{item.source_name ?? "—"}</td>
                <td>{item.published_at ? new Date(item.published_at).toLocaleDateString() : "—"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if hasMore}
        <button class="load-more" onclick={loadMore}>
          Load more ({filteredItems.length - visibleCount} remaining)
        </button>
      {/if}
      <p class="items-count">Showing {displayedItems.length} of {filteredItems.length} items</p>
      {#if selectedItem}
        <div class="drawer">
          <h3>{selectedItem.title}</h3>
          <dl>
            <dt>URL</dt>
            <dd><a href={selectedItem.url} target="_blank" rel="noopener">{selectedItem.url}</a></dd>
            <dt>Source</dt>
            <dd>{selectedItem.source_name}</dd>
            <dt>Published</dt>
            <dd>{selectedItem.published_at}</dd>
            <dt>Summary</dt>
            <dd>{selectedItem.summary ?? "—"}</dd>
          </dl>
          <button onclick={() => (selectedItem = null)}>Close</button>
        </div>
      {/if}
      {/if}
    </section>
  {:else if activeTab === "sources"}
    <section class="card">
      <h2>Sources Raw</h2>
      {#if !sourcesRaw?.by_source}
        <p class="callout callout-info">Sources raw not found</p>
      {:else}
        <div class="sources-raw">
          {#each Object.entries(sourcesRaw.by_source) as [srcId, raw]}
            <details>
              <summary>{srcId} ({Array.isArray(raw) ? raw.length : 0} items)</summary>
              <pre>{JSON.stringify(raw, null, 2)}</pre>
            </details>
          {/each}
        </div>
      {/if}
    </section>
  {:else if activeTab === "audit"}
    <section class="card">
      <h2>Audit</h2>
      {#if !acceptanceReport && !auditSummary}
        <p class="callout callout-info">No acceptance/audit for this run (normal for non-acceptance runs).</p>
      {:else if auditSummary}
        <pre>{JSON.stringify(auditSummary, null, 2)}</pre>
      {:else}
        <p>No audit summary</p>
      {/if}
      {#if tgSent != null || tgReadback != null}
        <h3>TG Evidence</h3>
        {#if tgSent != null}
          <h4>Sent</h4>
          <pre class="tg-text">{tgSent}</pre>
        {/if}
        {#if tgReadback != null}
          <h4>Readback</h4>
          <pre class="tg-text">{tgReadback}</pre>
        {/if}
      {:else}
        <p>No TG evidence</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .overview {
    max-width: 1200px;
  }
  .tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #ddd;
  }
  .tabs button {
    padding: 0.5rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  .tabs button:hover {
    background: #f0f0f0;
  }
  .tabs button.active {
    border-bottom-color: #0066cc;
    font-weight: 600;
  }
  .cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
  }
  .card h2 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
  }
  .card h3, .card h4 {
    margin: 1rem 0 0.5rem;
    font-size: 1rem;
  }
  dl {
    margin: 0;
  }
  dt {
    font-weight: 600;
    margin-top: 0.5rem;
    color: #555;
  }
  dd {
    margin: 0.25rem 0 0;
  }
  pre, code {
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
  }
  pre {
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 400px;
    overflow: auto;
  }
  .coverage-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .coverage-table th, .coverage-table td {
    padding: 0.25rem 0.5rem;
    text-align: left;
    border: 1px solid #ddd;
  }
  .status-ok { color: #155724; }
  .status-empty { color: #856404; }
  .status-error, .status-blocked { color: #721c24; }
  .status-rate_limited, .status-parse_error { color: #856404; }
  .meta {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  .meta .warn { color: #856404; }
  .meta .ok { color: #155724; }
  .rendered {
    font-family: ui-monospace, monospace;
    white-space: pre-wrap;
    max-height: 60vh;
    overflow: auto;
  }
  .filters {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .filters input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .filters select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .items-container {
    max-height: 60vh;
    overflow: auto;
    contain: strict;
  }
  .items-count {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.5rem;
  }
  .load-more {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border: 1px solid #0066cc;
    background: #fff;
    color: #0066cc;
    border-radius: 4px;
  }
  .load-more:hover {
    background: #e8f4fd;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .items-table th, .items-table td {
    padding: 0.5rem;
    text-align: left;
    border: 1px solid #ddd;
  }
  .items-table .title {
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-row {
    cursor: pointer;
  }
  .item-row:hover {
    background: #f0f0f0;
  }
  .item-row.selected {
    background: #e8f4fd;
  }
  .drawer {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  .drawer a {
    word-break: break-all;
  }
  .sources-raw details {
    margin-bottom: 0.5rem;
  }
  .sources-raw pre {
    max-height: 300px;
    font-size: 0.8rem;
  }
  .tg-text {
    max-height: 200px;
  }
  .callout {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  .callout-info {
    background: #e7f3ff;
    border: 1px solid #b3d9ff;
    color: #004085;
  }
  .error-banner {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  .error-banner small {
    opacity: 0.9;
  }
</style>
