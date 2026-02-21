<script>
  import { fetchJsonOrNull, fetchTextOrNull } from "../api.js";
  import { getRunDataBase } from "../config.js";

  let { runId, acceptanceReport, auditSummary, provenance, expanded = false, onExpand } = $props();

  let tgProvenance = $state(null);
  let tgSent = $state(null);
  let tgReadback = $state(null);
  let renderedText = $state(null);
  let open = $state(false);

  const hasAny = $derived(
    !!acceptanceReport || !!auditSummary || !!provenance || !!tgProvenance || tgSent != null || tgReadback != null || !!renderedText
  );

  $effect(() => {
    if (expanded && runId && (open || expanded)) {
      const base = getRunDataBase(runId);
      Promise.all([
        fetchJsonOrNull(`${base}/tg/provenance.json`),
        fetchTextOrNull(`${base}/tg/sent_text.txt`),
        fetchTextOrNull(`${base}/tg/readback_text.txt`),
        fetchTextOrNull(`${base}/rendered_text.txt`),
      ]).then(([tgp, tgs, tgr, rt]) => {
        tgProvenance = tgp;
        tgSent = tgs;
        tgReadback = tgr;
        renderedText = rt;
      });
    }
  });
</script>

<details class="evidence-panel" bind:open>
  <summary onclick={() => onExpand?.()}>Audit / Evidence (Advanced)</summary>
  {#if !hasAny && !expanded}
    <p class="empty">Expand to load audit, provenance, TG, and rendered text (if available).</p>
  {:else if !hasAny}
    <p class="empty">No acceptance/audit for this run (normal for non-acceptance runs).</p>
  {:else}
    {#if acceptanceReport?.gates}
      <section>
        <h4>Gates</h4>
        <pre>{JSON.stringify(acceptanceReport.gates, null, 2)}</pre>
      </section>
    {/if}
    {#if auditSummary}
      <section>
        <h4>Audit Summary</h4>
        <pre>{JSON.stringify(auditSummary, null, 2)}</pre>
      </section>
    {/if}
    {#if provenance}
      <section>
        <h4>Provenance</h4>
        <pre>{JSON.stringify(provenance, null, 2)}</pre>
      </section>
    {/if}
    {#if tgProvenance || tgSent != null || tgReadback != null}
      <section>
        <h4>TG Evidence</h4>
        {#if tgProvenance}
          <pre>{JSON.stringify(tgProvenance, null, 2)}</pre>
        {/if}
        {#if tgSent != null}
          <h5>Sent</h5>
          <pre class="tg-text">{tgSent}</pre>
        {/if}
        {#if tgReadback != null}
          <h5>Readback</h5>
          <pre class="tg-text">{tgReadback}</pre>
        {/if}
      </section>
    {/if}
    {#if renderedText}
      <section>
        <h4>Rendered (TG)</h4>
        <pre class="tg-text">{renderedText}</pre>
      </section>
    {/if}
  {/if}
</details>

<style>
  .evidence-panel {
    font-size: 0.65rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-top: 0.5rem;
  }
  .evidence-panel summary {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    background: var(--surface);
  }
  .evidence-panel section { padding: 0.5rem 0.75rem; border-top: 1px solid var(--border); }
  .evidence-panel h4, .evidence-panel h5 { margin: 0.5rem 0 0.25rem; font-size: 0.6rem; }
  .evidence-panel pre {
    font-size: 0.55rem;
    white-space: pre-wrap;
    max-height: 200px;
    overflow: auto;
  }
  .tg-text { max-height: 120px; }
  .empty { padding: 1rem; color: var(--text-muted); }
</style>
