import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve, join, dirname, relative } from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const ATLAS_ROOT = join(ROOT, "out", "atlas");

const ALLOWED_EXT = new Set([".json", ".txt"]);

function isPathSafe(relPath: string): boolean {
  if (relPath.includes("..") || relPath.startsWith("/") || relPath.includes("\\")) return false;
  const ext = relPath.slice(relPath.lastIndexOf("."));
  if (!ALLOWED_EXT.has(ext)) return false;
  const parts = relPath.split("/").filter(Boolean);
  if (parts[0] === "DELIVERY_RAW_STDOUT") return false;
  return true;
}

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: "atlas-fs",
      configureServer(server) {
        server.middlewares.use("/api/atlas", (req, res, next) => {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.end();
            return;
          }
          // When mounted at /api/atlas, req.url is the path AFTER the mount (e.g. /run_id/rendered_text.txt)
          const url = (req.url ?? "/").replace(/\?.*$/, "");
          const relPath = decodeURIComponent(url.replace(/^\/+/, "") || "");
          if (relPath === "" || relPath === "/") {
            try {
              let dirs: Array<Record<string, unknown>> = [];
              try {
                dirs = readdirSync(ATLAS_ROOT, { withFileTypes: true })
                .filter((d) => d.isDirectory() && d.name !== "DELIVERY_RAW_STDOUT" && !d.name.startsWith("ui-smoke-"))
                .map((d) => {
                  const runDir = join(ATLAS_ROOT, d.name);
                  let mtime = 0;
                  let meta: Record<string, unknown> = {};
                  try {
                    const stat = statSync(runDir);
                    mtime = stat.mtimeMs;
                    const metaPath = join(runDir, "render_meta.json");
                    if (statSync(metaPath).isFile()) {
                      meta = JSON.parse(readFileSync(metaPath, "utf-8"));
                    }
                  } catch {}
                  let itemCount: number = (meta.item_count as number) ?? 0;
                  if (itemCount === 0) {
                    try {
                      const normPath = join(runDir, "atlas-fetch", "items_normalized.json");
                      if (statSync(normPath).isFile()) {
                        const norm = JSON.parse(readFileSync(normPath, "utf-8")) as Record<string, unknown>;
                        itemCount = (norm.item_count as number) ?? (Array.isArray(norm.items) ? norm.items.length : 0);
                      }
                    } catch {}
                  }
                  let coverageSources: number | null = null;
                  let configuredSources: number | null = null;
                  let verdict = "UNKNOWN";
                  let pipelineVerdict: string | null = null;
                  let deliveryVerdict: string | null = null;
                  let deliveryReason: string | null = null;
                  try {
                    const accPath = join(runDir, "acceptance_report.json");
                    if (statSync(accPath).isFile()) {
                      const acc = JSON.parse(readFileSync(accPath, "utf-8")) as Record<string, unknown>;
                      verdict = (acc.verdict as string) || "UNKNOWN";
                      if (acc.coverage_sources != null) coverageSources = acc.coverage_sources as number;
                      if (acc.configured_sources != null) configuredSources = acc.configured_sources as number;
                    }
                  } catch {}
                  try {
                    const audPath = join(runDir, "audit", "summary.json");
                    if (statSync(audPath).isFile()) {
                      const aud = JSON.parse(readFileSync(audPath, "utf-8")) as Record<string, unknown>;
                      pipelineVerdict = (aud.pipeline_verdict as string) ?? null;
                      deliveryVerdict = (aud.delivery_verdict as string) ?? null;
                      deliveryReason = (aud.delivery_reason as string) ?? null;
                      if (verdict === "UNKNOWN" && pipelineVerdict) verdict = pipelineVerdict;
                      else if (verdict === "UNKNOWN") verdict = (aud.verdict as string) || "UNKNOWN";
                    }
                  } catch {}
                  if (coverageSources == null || configuredSources == null) {
                    try {
                      const provPath = join(runDir, "atlas-fetch", "provenance.json");
                      if (statSync(provPath).isFile()) {
                        const prov = JSON.parse(readFileSync(provPath, "utf-8")) as Record<string, unknown>;
                        const cov = prov.coverage as Array<unknown> | undefined;
                        const n = cov?.length ?? 0;
                        if (coverageSources == null) coverageSources = n;
                        if (configuredSources == null) configuredSources = n;
                      }
                    } catch {}
                  }
                  if (coverageSources == null || configuredSources == null) {
                    try {
                      const srPath = join(runDir, "atlas-fetch", "sources_raw.json");
                      if (statSync(srPath).isFile()) {
                        const sr = JSON.parse(readFileSync(srPath, "utf-8")) as Record<string, unknown>;
                        const bySource = sr.by_source as Record<string, unknown> | undefined;
                        const n = bySource ? Object.keys(bySource).length : 0;
                        if (coverageSources == null) coverageSources = n;
                        if (configuredSources == null) configuredSources = n;
                      }
                    } catch {}
                  }
                  if (verdict === "UNKNOWN") {
                    const cov = Number(coverageSources ?? 0);
                    const cfg = Number(configuredSources ?? 0);
                    if (cfg === 0 || cov === 0) {
                      verdict = "BLOCKED";
                    } else {
                      const okRate = cfg > 0 ? cov / cfg : 0;
                      verdict = okRate >= 0.65 ? "OK" : "DEGRADED";
                    }
                  }
                  return {
                    run_id: d.name,
                    mtime,
                    item_count: itemCount,
                    coverage_sources: coverageSources,
                    configured_sources: configuredSources,
                    verdict,
                    pipeline_verdict: pipelineVerdict ?? verdict,
                    delivery_verdict: deliveryVerdict,
                    delivery_reason: deliveryReason,
                  };
                })
                .sort((a, b) => (b.mtime as number) - (a.mtime as number));
              } catch {
                dirs = [];
              }
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ runs: dirs }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
            return;
          }
          const runId = relPath.split("/")[0];
          if (!runId || runId === "DELIVERY_RAW_STDOUT") {
            res.statusCode = 403;
            res.end();
            return;
          }
          if (!isPathSafe(relPath)) {
            res.statusCode = 403;
            res.end();
            return;
          }
          const fullPath = resolve(ATLAS_ROOT, relPath);
          const rel = relative(ATLAS_ROOT, fullPath);
          if (rel.startsWith("..") || rel.includes("..")) {
            res.statusCode = 403;
            res.end();
            return;
          }
          try {
            const content = readFileSync(fullPath, "utf-8");
            if (relPath.endsWith(".json")) {
              res.setHeader("Content-Type", "application/json");
              res.end(content);
            } else {
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end(content);
            }
          } catch {
            res.statusCode = 404;
            res.end();
          }
        });
      },
    },
  ],
    resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
