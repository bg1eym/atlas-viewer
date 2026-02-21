<script>
  let { renderedText = "", routingError = null } = $props();

  const charCount = $derived(renderedText?.length ?? 0);
  const TG_LIMIT = 4096;
  const tgLimitRisk = $derived(charCount > TG_LIMIT);
</script>

<div class="rendered-panel">
  {#if routingError}
    <div class="error-banner" role="alert">
      <strong>API routing error:</strong> rendered_text returned JSON (likely runs list).
      <br /><small>URL: {routingError.url}</small>
    </div>
  {:else}
    <div class="meta">
      <span>Chars: {charCount}</span>
      {#if tgLimitRisk}
        <span class="warn">⚠ Over TG limit (4096)</span>
      {:else}
        <span class="ok">✓ Within TG limit</span>
      {/if}
    </div>
    <pre class="rendered">{renderedText || "(empty)"}</pre>
  {/if}
</div>

<style>
  .rendered-panel { padding: 0.25rem 0; }
  .meta { font-size: 0.6rem; color: var(--text-muted); margin-bottom: 0.5rem; }
  .meta .warn { color: var(--warning); }
  .meta .ok { color: var(--success); }
  .rendered {
    font-size: 0.65rem;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 50vh;
    overflow: auto;
  }
  .error-banner {
    background: rgba(255, 68, 68, 0.15);
    border: 1px solid var(--danger);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.65rem;
  }
</style>
