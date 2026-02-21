<script>
  import ItemCard from "./ItemCard.svelte";

  let {
    items = [],
    initialSourceFilter = null,
    initialSourceFilterField = "source_name",
    sourceLabelMap = {},
    headerTitle = "Items",
    pageSize = 50,
    onClose,
    showClose = true,
    debugMode = false,
  } = $props();

  let currentPage = $state(1);
  let localSearch = $state("");
  let sourceFilter = $state("");
  $effect(() => {
    const init = initialSourceFilter ?? "";
    if (init) sourceFilter = init;
  });

  const filteredItems = $derived.by(() => {
    const t0 = performance.now();
    let list = items;
    if (sourceFilter) {
      if (initialSourceFilterField === "source_id") {
        list = list.filter((i) => (i.source_id ?? "") === sourceFilter);
      } else {
        list = list.filter((i) => (i.source_name ?? "") === sourceFilter);
      }
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      list = list.filter(
        (i) =>
          (i.title ?? "").toLowerCase().includes(q) ||
          (i.source_name ?? "").toLowerCase().includes(q) ||
          (i.source_id ?? "").toLowerCase().includes(q) ||
          (i.summary ?? "").toLowerCase().includes(q)
      );
    }
    const ms = performance.now() - t0;
    if (typeof window !== "undefined" && items.length > 100) {
      console.log(`[atlas] filter/search: ${items.length} items in ${ms.toFixed(1)}ms`);
    }
    return list;
  });

  const totalPages = $derived(Math.ceil(filteredItems.length / pageSize) || 1);
  const paginatedItems = $derived.by(() => {
    const t0 = performance.now();
    const slice = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const ms = performance.now() - t0;
    if (typeof window !== "undefined" && filteredItems.length > 100) {
      console.log(`[atlas] paginate render: ${slice.length} items in ${ms.toFixed(1)}ms`);
    }
    return slice;
  });

  const sources = $derived(
    [
      ...new Set(
        items
          .map((i) => (initialSourceFilterField === "source_id" ? i.source_id : i.source_name))
          .filter(Boolean),
      ),
    ].sort(),
  );

  $effect(() => {
    sourceFilter;
    localSearch;
    currentPage = 1;
  });
</script>

<div class="drilldown">
  <div class="drilldown-header">
    <h3>{headerTitle}</h3>
    {#if sourceFilter}
      <span class="debug-line">
        {initialSourceFilterField === "source_id"
          ? `${sourceLabelMap[sourceFilter] ?? sourceFilter} (${filteredItems.length})`
          : `${sourceFilter} (${filteredItems.length})`}
      </span>
    {/if}
    {#if debugMode && initialSourceFilter}
      <span class="debug-line" data-drilldown-debug>drilldown_mode=source source_id={initialSourceFilter}</span>
    {/if}
    {#if showClose !== false}
      <button class="close-btn" onclick={onClose}>✕</button>
    {/if}
  </div>
  <div class="filters">
    <input
      type="text"
      placeholder="Search"
      bind:value={localSearch}
    />
    <select bind:value={sourceFilter}>
      <option value="">All sources</option>
      {#each sources as s}
        <option value={s}>{initialSourceFilterField === "source_id" ? (sourceLabelMap[s] ?? s) : s}</option>
      {/each}
    </select>
  </div>
  <div class="items-list">
    {#each paginatedItems as item (item.id)}
      <ItemCard {item} />
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
  .drilldown {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 85vh;
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
  }
  .filters input {
    flex: 1;
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
  .debug-line {
    font-size: 0.5rem;
    color: var(--text-muted);
    margin-left: 0.5rem;
  }
</style>
