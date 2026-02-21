/**
 * PCK-ATLAS-006B: Data source config.
 * - VITE_ATLAS_DATA_BASE: override public data URL
 * - Default: https://bg1eym.github.io/atlas-data/out/atlas
 * - On localhost: use /api/atlas/ (local dev); else use public
 */
const DEFAULT_PUBLIC = "https://bg1eym.github.io/atlas-data/out/atlas";
const envBase =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_ATLAS_DATA_BASE;
export const ATLAS_DATA_BASE = envBase && envBase.startsWith("http") ? envBase : DEFAULT_PUBLIC;

export function isPublicData() {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return h !== "localhost" && h !== "127.0.0.1";
}

export function getRunDataBase(runId) {
  if (isPublicData()) {
    return `${ATLAS_DATA_BASE.replace(/\/$/, "")}/${runId}`;
  }
  return `/api/atlas/${runId}`;
}

export function getLatestUrl() {
  return isPublicData() ? `${ATLAS_DATA_BASE.replace(/\/$/, "")}/latest.json` : null;
}

export function getIndexUrl() {
  return isPublicData() ? `${ATLAS_DATA_BASE.replace(/\/$/, "")}/index.json` : null;
}
