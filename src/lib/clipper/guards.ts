/** Pure, dependency-free helpers for the URL clipper. Safe to unit test
 * (no `server-only`, no network). */

/** Reject private/loopback/link-local hosts to avoid SSRF. */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal"))
    return true;
  if (h === "::1" || h === "::") return true;
  // No dot → not a public FQDN (e.g. "router", "metadata")
  if (!h.includes(".") && !h.includes(":")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

/** Validate and normalize a clipper input URL. */
export function validateUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Parse robots.txt and decide if `path` is disallowed for our agent or `*`.
 * Best-effort: groups consecutive User-agent lines, applies the most specific
 * matching group's Disallow rules via simple prefix matching.
 */
export function pathIsDisallowed(robotsTxt: string, path: string): boolean {
  const lines = robotsTxt.split(/\r?\n/);
  const groups: { agents: string[]; disallows: string[] }[] = [];
  let current: { agents: string[]; disallows: string[] } | null = null;
  let lastWasAgent = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallows: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (field === "disallow" && current) {
      current.disallows.push(value);
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }

  const relevant = groups.filter(
    (g) =>
      g.agents.includes("*") || g.agents.some((a) => a.includes("wardrobe")),
  );
  for (const g of relevant) {
    for (const dis of g.disallows) {
      if (dis === "") continue; // empty Disallow = allow all
      if (path.startsWith(dis)) return true;
    }
  }
  return false;
}
