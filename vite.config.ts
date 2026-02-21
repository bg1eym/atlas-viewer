import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readdirSync, statSync, readFileSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ATLAS_ROOT = resolve(__dirname, "../..");

function atlasApiPlugin() {
  return {
    name: "atlas-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/atlas")) return next();
        const match = req.url.match(/^\/api\/atlas\/(.*)$/);
        if (!match) return next();
        const sub = match[1].replace(/^\/+/, "");
        if (!sub) {
          const dir = resolve(ATLAS_ROOT, "out", "atlas");
          if (!existsSync(dir)) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ runs: [] }));
            return;
          }
          const runs: { run_id: string; verdict?: string }[] = [];
          for (const name of readdirSync(dir)) {
            if (name === "DELIVERY_RAW_STDOUT") continue;
            const fp = resolve(dir, name);
            if (!statSync(fp).isDirectory()) continue;
            const resultPath = resolve(fp, "result.json");
            const verdict = existsSync(resultPath)
              ? (() => { try { return JSON.parse(readFileSync(resultPath, "utf-8")).coverage?.pipeline_verdict || "UNKNOWN"; } catch { return "UNKNOWN"; } })()
              : "UNKNOWN";
            runs.push({ run_id: name, verdict });
          }
          runs.sort((a, b) => {
            const am = statSync(resolve(dir, a.run_id)).mtimeMs;
            const bm = statSync(resolve(dir, b.run_id)).mtimeMs;
            return bm - am;
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ runs }));
          return;
        }
        const [runId, ...rest] = sub.split("/");
        const filePath = resolve(ATLAS_ROOT, "out", "atlas", runId, ...rest);
        if (filePath.includes("..") || !filePath.startsWith(resolve(ATLAS_ROOT, "out", "atlas"))) {
          res.writeHead(403);
          res.end();
          return;
        }
        if (!existsSync(filePath) || !statSync(filePath).isFile()) {
          res.writeHead(404);
          res.end();
          return;
        }
        const ext = filePath.split(".").pop()?.toLowerCase();
        const ct = ext === "json" ? "application/json" : ext === "txt" ? "text/plain" : "application/octet-stream";
        res.writeHead(200, { "Content-Type": ct });
        res.end(readFileSync(filePath));
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), atlasApiPlugin()],
  base: "/atlas-viewer/",
});
