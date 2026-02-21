<script>
  import { fetchJsonOrNull, fetchWithMeta } from "../api.js";
  import Panel from "./Panel.svelte";
  import Header from "./Header.svelte";
  import KpiCards from "./KpiCards.svelte";
  import SourceHealthPanel from "./SourceHealthPanel.svelte";
  import DistributionPanel from "./DistributionPanel.svelte";
  import ItemsDrilldown from "./ItemsDrilldown.svelte";
  import CivilizationHeatmapPanel from "./CivilizationHeatmapPanel.svelte";
  import Civilization5DPanel from "./Civilization5DPanel.svelte";
  import CivilizationDrilldown from "./CivilizationDrilldown.svelte";
  import RadarCategoriesPanel from "./RadarCategoriesPanel.svelte";
  import SourcesKolPanel from "./SourcesKolPanel.svelte";
  import EvidencePanel from "./EvidencePanel.svelte";

  let {
    runId,
    runMeta = null,
    debugMode = false,
    debugInfo = {},
    onDebugUpdate,
  } = $props();

  let renderMeta = $state(null);
  let provenance = $state(null);
  let acceptanceReport = $state(null);
  let items = $state([]);
  let auditSummary = $state(null);
  let tgProvenance = $state(null);
  let tgSent = $state(null);
  let tgReadback = $state(null);
  let coverageStatsJson = $state(null);
  let inputPackGate = $state(null);
  let fetchHealthGate = $state(null);
  let highlights = $state(null);
  let aggregates = $state(null);
  let itemsCiv = $state([]);
  let activeSecondaryTab = $state("raw");
  let evidenceExpanded = $state(false);
  let drilldownOpen = $state(false);
  let drilldownSource = $state(null);
  let drilldownSourceName = $state(null);
  let drilldownSourceField = $state("source_name");
  let radarDrilldownOpen = $state(false);
  let radarDrilldownCategory = $state(null);
  let civDrilldownOpen = $state(false);
  let civDrilldownTag = $state(null);
  let selectedRadarCategory = $state(null);

  const PAGE_SIZE = 50;

  const coverageStats = $derived.by(() => {
    const cov = provenance?.coverage ?? [];
    const stats = { ok: 0, empty: 0, rate_limited: 0, error: 0 };
    for (const c of cov) {
      const s = (c.status ?? "").toLowerCase();
      if (s === "ok") stats.ok++;
      else if (s === "empty") stats.empty++;
      else if (s === "rate_limited" || s === "parse_error") stats.rate_limited++;
      else stats.error++;
    }
    return stats;
  });

  const aiRejectCount = $derived(renderMeta?.filter_report?.rejected_items_count ?? 0);

  const hasCivilization = $derived(highlights != null && aggregates != null);

  const countsByRadar = $derived.by(() => {
    if (aggregates?.counts_by_radar_category) return aggregates.counts_by_radar_category;
    const counts = {};
    for (const it of items) {
      const cat = it.category_hint ?? "uncategorized";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  });

  const filteredByCategory = $derived.by(() => {
    if (!selectedRadarCategory) return itemsCiv.length ? itemsCiv : items;
    if (itemsCiv.length) return itemsCiv.filter((i) => i.radar_categories?.[0]?.id === selectedRadarCategory);
    return items.filter((i) => (i.category_hint ?? "") === selectedRadarCategory);
  });

  const itemsWithSummaryZh = $derived.by(() => {
    const zhMap = new Map();
    for (const c of itemsCiv) {
      if (c.id && c.summary_zh) zhMap.set(c.id, c.summary_zh);
    }
    return items.map((i) => (zhMap.has(i.id) ? { ...i, summary_zh: zhMap.get(i.id) } : i));
  });

  const topCivTag = $derived.by(() => {
    if (!aggregates?.counts_by_tag) return { tag: "—", count: 0 };
    const entries = Object.entries(aggregates.counts_by_tag);
    if (entries.length === 0) return { tag: "—", count: 0 };
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return { tag: sorted[0][0], count: sorted[0][1] };
  });

  const sourceIdToName = $derived.by(() => {
    const map = {};
    const cov = provenance?.coverage ?? [];
    for (const c of cov) {
      map[c.source_id] = c.source_name ?? c.source_id;
    }
    return map;
  });
  const blockedDebugInfo = $derived.by(() => ({
    reason: auditSummary?.reason ?? "—",
    inputPack: inputPackGate,
    fetchHealth: fetchHealthGate,
    topFailedSources: coverageStatsJson?.top_failed_sources ?? [],
  }));
  const showBlockedDebug = $derived.by(() => {
    const pv = (runMeta?.pipeline_verdict ?? auditSummary?.pipeline_verdict ?? runMeta?.verdict ?? auditSummary?.verdict ?? "").toLowerCase();
    const dv = (runMeta?.delivery_verdict ?? auditSummary?.delivery_verdict ?? "").toLowerCase();
    return (pv !== "ok" && pv !== "pass") || (dv !== "" && dv !== "ok");
  });
  const tgStatus = $derived("—");

  async function loadRun() {
    if (!runId) return;
    const base = `/api/atlas/${runId}`;
    try {
      const renderMetaUrl = `${base}/render_meta.json`;
      let rm;
      if (debugMode && onDebugUpdate) {
        const metaRm = await fetchWithMeta(renderMetaUrl, { as: "json" });
        rm = metaRm?.data ?? null;
        if (metaRm) onDebugUpdate("render_meta", { url: metaRm.url, status: metaRm.status, contentType: metaRm.contentType, bodyPreview: metaRm.bodyPreview });
      } else {
        rm = await fetchJsonOrNull(renderMetaUrl);
      }
      renderMeta = rm;

      const t0 = performance.now();
      const [pv, acc, it, aud, hl, agg, civ, covStats, inPack, fetchHealth] = await Promise.all([
        fetchJsonOrNull(`${base}/atlas-fetch/provenance.json`),
        fetchJsonOrNull(`${base}/acceptance_report.json`),
        fetchJsonOrNull(`${base}/atlas-fetch/items_normalized.json`),
        fetchJsonOrNull(`${base}/audit/summary.json`),
        fetchJsonOrNull(`${base}/civilization/highlights.json`),
        fetchJsonOrNull(`${base}/civilization/aggregates.json`),
        fetchJsonOrNull(`${base}/civilization/items_civ.json`),
        fetchJsonOrNull(`${base}/coverage_stats.json`),
        fetchJsonOrNull(`${base}/audit/input_pack_gate_summary.json`),
        fetchJsonOrNull(`${base}/audit/fetch_health_gate_summary.json`),
      ]);
      provenance = pv;
      acceptanceReport = acc;
      items = it?.items ?? [];
      auditSummary = aud;
      tgProvenance = null;
      tgSent = null;
      tgReadback = null;
      highlights = hl;
      aggregates = agg;
      itemsCiv = civ?.items ?? [];
      coverageStatsJson = covStats;
      inputPackGate = inPack;
      fetchHealthGate = fetchHealth;
      const loadMs = performance.now() - t0;
      if (typeof window !== "undefined") {
        console.log(`[atlas] initial load parse: ${loadMs.toFixed(1)}ms`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  $effect(() => {
    runId;
    loadRun();
  });

  function openDrilldown(sourceId = null, sourceName = null, field = "source_id") {
    drilldownSource = sourceId;
    drilldownSourceName = sourceName;
    drilldownSourceField = field;
    drilldownOpen = true;
  }

  function openCivDrilldown(tag = null) {
    civDrilldownTag = tag;
    civDrilldownOpen = true;
  }
</script>

<div class="dashboard-view">
  <Header
    runId={runId}
    runMeta={{ ...runMeta, item_count: renderMeta?.item_count ?? runMeta?.item_count }}
    mtime={runMeta?.mtime}
    coverageSources={runMeta?.coverage_sources}
    configuredSources={runMeta?.configured_sources}
    verdict={runMeta?.pipeline_verdict ?? runMeta?.verdict}
    pipelineVerdict={runMeta?.pipeline_verdict}
    deliveryVerdict={runMeta?.delivery_verdict}
    deliveryReason={runMeta?.delivery_reason}
    title="Atlas Civilization Situation Monitor"
  />

  <div class="kpi-section" data-testid="dashboard-first-screen">
    <KpiCards
      itemCount={renderMeta?.item_count ?? runMeta?.item_count ?? items.length}
      coverageStats={coverageStats}
      aiRejectCount={aiRejectCount}
      structuralCount={aggregates?.structural_count ?? 0}
      topCivTag={topCivTag.tag}
      topCivCount={topCivTag.count}
    />
  </div>

  <main class="dashboard-main">
    <div class="radar-layout">
      <div class="radar-sidebar">
        <RadarCategoriesPanel
          selectedCategory={selectedRadarCategory}
          countsByRadar={countsByRadar}
          onSelect={(id) => (selectedRadarCategory = id)}
          onOpenRadarDrilldown={(cat) => (radarDrilldownCategory = cat, radarDrilldownOpen = true)}
        />
        <Panel title="Sources & KOL">
          <SourcesKolPanel
            selectedCategory={selectedRadarCategory}
            coverage={provenance?.coverage ?? []}
            onSourceClick={(sid, sname) => openDrilldown(sid, sname, "source_id")}
            onKolClick={(sid, sname) => openDrilldown(sid, sname, "source_id")}
          />
        </Panel>
      </div>
      <div class="radar-main">
    <div class="dashboard-grid">
      {#if hasCivilization}
        <Panel title="Civilization" count={aggregates?.structural_count ?? 0}>
          <CivilizationHeatmapPanel
            structuralCountByTag={aggregates?.structural_count_by_tag ?? {}}
            structuralCount={aggregates?.structural_count ?? 0}
            onTagClick={openCivDrilldown}
          />
        </Panel>
        <Panel title="Five-D Distribution">
          <Civilization5DPanel avgScoreByTag={aggregates?.avg_score_by_tag ?? {}} />
        </Panel>
      {/if}
      <Panel title="Source Health" count={provenance?.coverage?.length ?? 0}>
        <SourceHealthPanel
          coverage={provenance?.coverage ?? []}
          onSourceClick={(sid, sname) => openDrilldown(sid, sname, "source_id")}
          {sourceIdToName}
        />
      </Panel>
      <Panel title="Items by Source" count={selectedRadarCategory ? filteredByCategory.length : items.length}>
        <DistributionPanel items={selectedRadarCategory ? filteredByCategory : items} coverage={provenance?.coverage ?? []} onSourceClick={(sname) => openDrilldown(sname, sname, "source_name")} />
      </Panel>
    </div>
      </div>
    </div>

    {#if showBlockedDebug}
      <Panel title="Blocked Debug">
        <div class="blocked-debug">
          <div><strong>Pipeline:</strong> {runMeta?.pipeline_verdict ?? auditSummary?.pipeline_verdict ?? auditSummary?.verdict ?? "—"} {(auditSummary?.reason && (runMeta?.pipeline_verdict ?? auditSummary?.pipeline_verdict ?? "").toLowerCase() === "blocked") ? `(${auditSummary.reason})` : ""}</div>
          <div><strong>Delivery (TG):</strong> {runMeta?.delivery_verdict ?? auditSummary?.delivery_verdict ?? "—"} {((runMeta?.delivery_reason ?? auditSummary?.delivery_reason) ? `(${runMeta?.delivery_reason ?? auditSummary?.delivery_reason})` : "")}</div>
          <div><strong>Input Pack:</strong> {blockedDebugInfo.inputPack?.verdict ?? "—"} {blockedDebugInfo.inputPack?.reason ? `(${blockedDebugInfo.inputPack.reason})` : ""}</div>
          <div><strong>Fetch Health:</strong> {blockedDebugInfo.fetchHealth?.verdict ?? "—"}</div>
          <div class="failed-list">
            <strong>Top Failed Sources:</strong>
            {#if blockedDebugInfo.topFailedSources.length === 0}
              <div>none</div>
            {:else}
              {#each blockedDebugInfo.topFailedSources.slice(0, 10) as fs}
                <div>{fs.source_name ?? fs.source_id}: {fs.bucket ?? "unknown"} ({fs.reason ?? "—"})</div>
              {/each}
            {/if}
          </div>
        </div>
      </Panel>
    {/if}

    <div class="secondary-tabs">
      <button
        class:active={activeSecondaryTab === "raw"}
        onclick={() => (activeSecondaryTab = "raw")}
      >
        Raw items
      </button>
      <button
        class:active={activeSecondaryTab === "evidence"}
        onclick={() => (activeSecondaryTab = "evidence", evidenceExpanded = true)}
      >
        Audit / Evidence (Advanced)
      </button>
    </div>
    {#if activeSecondaryTab === "raw"}
      <Panel title="Raw Items" count={items.length}>
        <ItemsDrilldown
          items={itemsWithSummaryZh}
          initialSourceFilter={null}
          headerTitle="Items"
          pageSize={PAGE_SIZE}
          onClose={() => {}}
          showClose={false}
        />
      </Panel>
    {:else}
      <EvidencePanel
        runId={runId}
        acceptanceReport={acceptanceReport}
        auditSummary={auditSummary}
        provenance={provenance}
        expanded={evidenceExpanded}
        onExpand={() => (evidenceExpanded = true)}
      />
    {/if}
  </main>

  {#if drilldownOpen}
    <div
      class="drilldown-overlay"
      role="button"
      tabindex="-1"
      onclick={() => (drilldownOpen = false)}
      onkeydown={(e) => e.key === "Escape" && (drilldownOpen = false)}
    >
      <div
        class="drilldown-modal"
        role="dialog"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <ItemsDrilldown
          items={itemsWithSummaryZh}
          initialSourceFilter={drilldownSource}
          initialSourceFilterField={drilldownSourceField}
          sourceLabelMap={sourceIdToName}
          headerTitle={drilldownSource ? `Source: ${drilldownSourceName ?? sourceIdToName[drilldownSource] ?? drilldownSource}` : "Items"}
          pageSize={PAGE_SIZE}
          onClose={() => (drilldownOpen = false)}
          showClose={true}
          debugMode={debugMode}
        />
      </div>
    </div>
  {/if}

  {#if radarDrilldownOpen && radarDrilldownCategory}
    <div
      class="drilldown-overlay"
      role="button"
      tabindex="-1"
      onclick={() => (radarDrilldownOpen = false)}
      onkeydown={(e) => e.key === "Escape" && (radarDrilldownOpen = false)}
    >
      <div
        class="drilldown-modal"
        role="dialog"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <ItemsDrilldown
          items={itemsWithSummaryZh.filter((i) => (i.category_hint ?? "") === radarDrilldownCategory)}
          initialSourceFilter={null}
          headerTitle={"Radar: " + radarDrilldownCategory}
          pageSize={PAGE_SIZE}
          onClose={() => (radarDrilldownOpen = false)}
          showClose={true}
        />
      </div>
    </div>
  {/if}

  {#if civDrilldownOpen}
    <div
      class="drilldown-overlay"
      role="button"
      tabindex="-1"
      onclick={() => (civDrilldownOpen = false)}
      onkeydown={(e) => e.key === "Escape" && (civDrilldownOpen = false)}
    >
      <div
        class="drilldown-modal"
        role="dialog"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <CivilizationDrilldown
          items={selectedRadarCategory ? filteredByCategory : itemsCiv}
          initialTagFilter={civDrilldownTag}
          pageSize={PAGE_SIZE}
          onClose={() => (civDrilldownOpen = false)}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-view {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
  .kpi-section { padding: 0.5rem 1rem; }
  .dashboard-main { flex: 1; padding: 0 1rem 1rem; }
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .secondary-tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }
  .secondary-tabs button {
    padding: 0.35rem 0.75rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.65rem;
  }
  .secondary-tabs button:hover { background: var(--border); color: var(--text-primary); }
  .secondary-tabs button.active { background: var(--border); color: var(--accent); }
  .drilldown-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .drilldown-modal {
    width: 95%;
    max-width: 960px;
    max-height: 90vh;
  }
  .radar-layout { display: flex; gap: 1rem; }
  .radar-sidebar { width: 200px; flex-shrink: 0; }
  .radar-main { flex: 1; min-width: 0; }
  .blocked-debug {
    font-size: 0.65rem;
    color: var(--text-secondary);
    display: grid;
    gap: 0.35rem;
  }
  .failed-list {
    max-height: 160px;
    overflow: auto;
  }
</style>
