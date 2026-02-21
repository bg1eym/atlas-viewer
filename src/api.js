/**
 * Safe fetch helpers. Return null on non-2xx (no throw).
 */
export async function fetchJsonOrNull(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function fetchTextOrNull(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/**
 * Fetch text with metadata for routing-error detection.
 * Returns { text, contentType, url, status, bodyPreview } or null on non-2xx.
 */
export async function fetchTextWithMeta(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const text = await r.text();
    const contentType = r.headers.get("content-type") ?? "";
    return { text, contentType, url, status: r.status, bodyPreview: text.slice(0, 120) };
  } catch {
    return null;
  }
}

/**
 * Fetch with full metadata for debug mode.
 * Returns { status, contentType, bodyPreview, url, data } (data is parsed JSON or text).
 */
export async function fetchWithMeta(url, options = {}) {
  const as = options.as ?? "text";
  try {
    const r = await fetch(url);
    const contentType = r.headers.get("content-type") ?? "";
    const body = await r.text();
    const bodyPreview = body.slice(0, 120);
    if (as === "json") {
      const data = r.ok ? JSON.parse(body) : null;
      return { status: r.status, contentType, bodyPreview, url, data };
    }
    return { status: r.status, contentType, bodyPreview, url, data: r.ok ? body : null };
  } catch {
    return null;
  }
}
