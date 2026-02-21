<script>
  import CivItemCard from "./CivItemCard.svelte";

  let {
    items = [],
    initialTagFilter = null,
    pageSize = 50,
    onClose,
  } = $props();

  let currentPage = $state(1);
  let localSearch = $state("");
  let tagFilter = $state("");
  let structuralOnly = $state(false);

  $effect(() => {
    const init = initialTagFilter ?? "";
    if (init) tagFilter = init;
  });

  const filteredItems = $derived.by(() => {
    const t0 = performance.now();
    let list = items;
    if (tagFilter) {
      list = list.filter((i) => (i.civ_primary_tag ?? "") === tagFilter);
    }
    if (structuralOnly) {
      list = list.filter((i) => (i.score_total ?? 0) >= 7);
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      list = list.filter(
        (i) =>
          (i.title ?? "").toLowerCase().includes(q) ||
          (i.source_name ?? "").toLowerCase().includes(q) ||
          (i.summary_zh ?? "").toLowerCase().includes(q) ||
          (i.summary ?? "").toLowerCase().includes(q)
      );
    }
    const ms = performance.now() - t0;
    if (typeof window !== "undefined" && items.length > 100) {
      console.log(`[atlas] civ drilldown filter: ${items.length} items in ${ms.toFixed(1)}ms`);
    }
    return list;
  });

  const totalPages = $derived(Math.ceil(filteredItems.length / pageSize) || 1);
  const paginatedItems = $derived(
    filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );

  const tags = $derived(
    [...new Set(items.map((i) => i.civ_primary_tag).filter(Boolean))].sort()
  );

  $effect(() => {
    tagFilter;
    localSearch;
    structuralOnly;
    currentPage = 1;
  });
</script>

<div class="civ-drilldown">
  <div class="drilldown-header">
    <h3>Civilization Items</h3>
    <button class="close-btn" onclick={onClose}>✕</button>
  </div>
  <div class="filters">
    <input
      type="text"
      placeholder="Search"
      bind:value={localSearch}
    />
    <select bind:value={tagFilter}>
      <option value="">All tags</option>
      {#each tags as t}
        <option value={t}>{t}</option>
      {/each}
    </select>
    <label class="toggle-label">
      <input type="checkbox" bind:checked={structuralOnly} />
      Structural only (≥7)
    </label>
  </div>
  <div class="items-list">
    {#each paginatedItems as item (item.id ?? item.url ?? item.title)}
      <CivItemCard {item} />
    {/each}
  </div>
  <div class="pagination">
    <span class="pagination-info">
      {filteredItems.length} total · page {currentPage} of {totalPages}
    </span>
    <div class="pagination-btns">
      <button
        disabled={currentPage <= 1}
        onclick={() => (currentPage = Math.max(1, currentPage - 1))}
      >
        ←
      </button>
      <button
        disabled={currentPage >= totalPages}
        onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
      >
        →
      </button>
    </div>
  </div>
</div>

<style>
  .civ-drilldown {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 70vh;
  }
  .drilldown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .drilldown-header h3 { font-size: 0.65rem; margin: 0; text-transform: uppercase; }
  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.8rem;
  }
  .filters {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    align-items: center;
  }
  .filters input {
    flex: 1;
    min-width: 100px;
    padding: 0.35rem 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-primary);
    font-size: 0.65rem;
  }
  .filters select {
    padding: 0.35rem 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-primary);
    font-size: 0.65rem;
  }
  .toggle-label {
    font-size: 0.6rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .items-list {
    flex: 1;
    overflow-y: auto;
    min-height: 200px;
  }
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--border);
    font-size: 0.6rem;
    color: var(--text-muted);
  }
  .pagination-btns { display: flex; gap: 0.25rem; }
  .pagination-btns button {
    padding: 0.25rem 0.5rem;
    background: var(--border);
    border: none;
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.6rem;
  }
  .pagination-btns button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
