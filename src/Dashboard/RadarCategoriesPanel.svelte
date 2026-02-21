<script>
  import { RADAR_CATEGORIES } from "../data/radar_categories.js";

  let { selectedCategory = null, countsByRadar = {}, onSelect, onOpenRadarDrilldown } = $props();

  function handleCategoryClick(cat) {
    onSelect?.(cat.id);
    onOpenRadarDrilldown?.(cat.id);
    if (typeof window !== "undefined") {
      console.log(`[atlas] drilldown_mode=radar category=${cat.id}`);
    }
  }
</script>

<div class="radar-categories" data-testid="radar-categories-panel">
  <h3 class="panel-title">Radar Categories</h3>
  <ul class="category-list">
    {#each RADAR_CATEGORIES as cat}
      <li>
        <button
          type="button"
          class="category-btn"
          class:selected={selectedCategory === cat.id}
          onclick={() => handleCategoryClick(cat)}
        >
          <span class="cat-label">{cat.label_zh}</span>
          <span class="cat-count">{countsByRadar[cat.id] ?? 0}</span>
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .radar-categories { padding: 0.5rem; }
  .panel-title {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
  }
  .category-list { list-style: none; margin: 0; padding: 0; }
  .category-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.5rem;
    margin-bottom: 0.2rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.7rem;
    text-align: left;
  }
  .category-btn:hover { background: var(--surface-hover); }
  .category-btn.selected {
    background: rgba(var(--accent-rgb), 0.15);
    border-color: var(--accent);
  }
  .cat-count { font-size: 0.6rem; color: var(--text-muted); }
</style>
