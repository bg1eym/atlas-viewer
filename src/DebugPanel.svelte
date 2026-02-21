<script>
  let { debugInfo = {} } = $props();
</script>

{#if Object.keys(debugInfo).length > 0}
  <details class="debug-panel">
    <summary>Debug: API diagnostics</summary>
    <dl>
      {#if debugInfo.runId}
        <dt>selected run_id</dt>
        <dd><code>{debugInfo.runId}</code></dd>
      {/if}
      {#if debugInfo.runs}
        <dt>runs</dt>
        <dd>
          <span class="meta">{debugInfo.runs.status} · {debugInfo.runs.contentType}</span>
          <br /><code>{debugInfo.runs.url}</code>
          <details class="body-preview"><summary>body (first 120)</summary><pre>{debugInfo.runs.bodyPreview}</pre></details>
        </dd>
      {/if}
      {#if debugInfo.render_meta}
        <dt>render_meta</dt>
        <dd>
          <span class="meta">{debugInfo.render_meta.status} · {debugInfo.render_meta.contentType}</span>
          <br /><code>{debugInfo.render_meta.url}</code>
          <details class="body-preview"><summary>body (first 120)</summary><pre>{debugInfo.render_meta.bodyPreview}</pre></details>
        </dd>
      {/if}
      {#if debugInfo.rendered_text}
        <dt>rendered_text</dt>
        <dd>
          <span class="meta">{debugInfo.rendered_text.status} · {debugInfo.rendered_text.contentType}</span>
          <br /><code>{debugInfo.rendered_text.url}</code>
          <details class="body-preview"><summary>body (first 120)</summary><pre>{debugInfo.rendered_text.bodyPreview}</pre></details>
        </dd>
      {/if}
    </dl>
  </details>
{/if}

<style>
  .debug-panel {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.8rem;
  }
  .debug-panel summary {
    cursor: pointer;
    font-weight: 600;
  }
  .debug-panel dt {
    margin-top: 0.5rem;
    color: #495057;
  }
  .debug-panel dd {
    margin: 0.25rem 0 0;
  }
  .debug-panel .meta {
    color: #6c757d;
  }
  .debug-panel code {
    font-size: 0.75rem;
    word-break: break-all;
  }
  .debug-panel .body-preview {
    margin-top: 0.25rem;
  }
  .debug-panel .body-preview pre {
    font-size: 0.7rem;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 100px;
    overflow: auto;
  }
</style>
