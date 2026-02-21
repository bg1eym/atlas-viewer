<script>
  import RunBrowser from "./RunBrowser.svelte";
  import DashboardView from "./Dashboard/DashboardView.svelte";
  import DebugPanel from "./DebugPanel.svelte";
  import { fetchWithMeta } from "./api.js";

  let selectedRunId = $state(null);
  let runs = $state([]);
  let debugMode = $state(false);
  let debugInfo = $state({});

  const selectedRunMeta = $derived(runs.find((r) => r.run_id === selectedRunId) ?? null);

  $effect(() => {
    if (typeof window !== "undefined") {
      debugMode = new URLSearchParams(window.location.search).get("debug") === "1";
    }
  });

  async function loadRuns() {
    try {
      if (debugMode) {
        const meta = await fetchWithMeta("/api/atlas/", { as: "json" });
        if (meta) {
          debugInfo = { ...debugInfo, runs: { url: meta.url, status: meta.status, contentType: meta.contentType, bodyPreview: meta.bodyPreview } };
          runs = meta.data?.runs ?? [];
        }
      } else {
        const r = await fetch("/api/atlas/");
        const data = await r.json();
        const allRuns = data.runs ?? [];
        runs = allRuns.filter((run) => !(run.run_id || "").startsWith("ui-smoke-"));
      }
      if (runs.length > 0 && !selectedRunId) {
        selectedRunId = runs[0].run_id;
      }
      if (debugMode && selectedRunId) {
        debugInfo = { ...debugInfo, runId: selectedRunId };
      }
    } catch (e) {
      runs = [];
    }
  }

  $effect(() => {
    loadRuns();
  });

  function onSelectRun(id) {
    selectedRunId = id;
    if (debugMode) {
      debugInfo = { ...debugInfo, runId: id };
    }
  }
</script>

<div class="app">
  <aside class="sidebar">
    <h1>Atlas Radar</h1>
    <RunBrowser {runs} {selectedRunId} onSelect={onSelectRun} onRefresh={loadRuns} />
  </aside>
  <main class="main">
    {#if debugMode}
      <DebugPanel {debugInfo} />
    {/if}
    {#if selectedRunId}
      <DashboardView
        runId={selectedRunId}
        runMeta={selectedRunMeta}
        {debugMode}
        {debugInfo}
        onDebugUpdate={(slot, info) => {
          debugInfo = { ...debugInfo, [slot]: info };
        }}
      />
    {:else}
      <p class="empty">Select a run from the sidebar</p>
    {/if}
  </main>
</div>

<style>
  .app {
    display: flex;
    height: 100vh;
    font-family: system-ui, sans-serif;
  }
  .sidebar {
    width: 280px;
    border-right: 1px solid var(--border);
    overflow-y: auto;
    background: var(--surface);
  }
  .main {
    flex: 1;
    overflow: auto;
    padding: 0;
  }
  .empty {
    color: var(--text-muted);
    padding: 2rem;
    font-size: 0.8rem;
  }
  h1 {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
    margin: 0;
    border-bottom: 1px solid var(--border);
    font-weight: 700;
    letter-spacing: 0.05em;
  }
</style>
