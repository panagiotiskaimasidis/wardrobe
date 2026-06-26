import "server-only";

import { extractProductMetadata, type ParsedProduct } from "./parse";
import { isBlockedHost, validateUrl, pathIsDisallowed } from "./guards";

const USER_AGENT =
  process.env.CLIPPER_USER_AGENT ??
  "WardrobeBot/1.0 (+https://github.com/panagiotiskaimasidis/wardrobe)";

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000; // 2 MB cap on fetched HTML
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type ClipResult =
  | { ok: true; product: ParsedProduct; cached: boolean }
  | { ok: false; error: string; code: ClipErrorCode };

export type ClipErrorCode =
  | "invalid_url"
  | "blocked_host"
  | "robots_disallowed"
  | "fetch_failed"
  | "not_html";

// Simple in-memory cache (per server instance). Good enough for dev/demo and
// keeps us from hammering source sites on repeated pastes.
const cache = new Map<string, { at: number; product: ParsedProduct }>();

async function fetchWithLimits(
  url: string,
  signal: AbortSignal,
): Promise<{ status: number; contentType: string; body: string }> {
  const res = await fetch(url, {
    signal,
    redirect: "follow",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  const contentType = res.headers.get("content-type") ?? "";
  // Read with a byte cap.
  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    return { status: res.status, contentType, body: text.slice(0, MAX_BYTES) };
  }
  const decoder = new TextDecoder();
  let received = 0;
  let body = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    body += decoder.decode(value, { stream: true });
    if (received >= MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  return { status: res.status, contentType, body };
}

/**
 * Best-effort robots.txt check. Fetches /robots.txt and honours `Disallow`
 * rules under a matching `User-agent` group (our bot name or `*`). On any
 * failure we fail open (allow) — robots.txt is advisory and many sites lack one.
 */
async function isAllowedByRobots(
  url: URL,
  signal: AbortSignal,
): Promise<boolean> {
  try {
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
    const res = await fetch(robotsUrl, {
      signal,
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return true;
    const text = (await res.text()).slice(0, 100_000);
    return !pathIsDisallowed(text, url.pathname);
  } catch {
    return true;
  }
}

/** Fetch a product page and extract a draft product from its public metadata. */
export async function fetchProductMetadata(raw: string): Promise<ClipResult> {
  const url = validateUrl(raw);
  if (!url) {
    return {
      ok: false,
      code: "invalid_url",
      error: "Please enter a valid http(s) URL.",
    };
  }
  if (isBlockedHost(url.hostname)) {
    return {
      ok: false,
      code: "blocked_host",
      error: "That host isn't allowed.",
    };
  }

  const key = url.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ok: true, product: hit.product, cached: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const allowed = await isAllowedByRobots(url, controller.signal);
    if (!allowed) {
      return {
        ok: false,
        code: "robots_disallowed",
        error:
          "This site's robots.txt asks bots not to fetch that page. You can still add the item manually.",
      };
    }

    const { status, contentType, body } = await fetchWithLimits(
      key,
      controller.signal,
    );
    if (status >= 400) {
      return {
        ok: false,
        code: "fetch_failed",
        error: `The page returned HTTP ${status}.`,
      };
    }
    if (contentType && !contentType.includes("html")) {
      return {
        ok: false,
        code: "not_html",
        error: "That link doesn't look like a web page.",
      };
    }

    const product = extractProductMetadata(body, key);
    cache.set(key, { at: Date.now(), product });
    return { ok: true, product, cached: false };
  } catch {
    return {
      ok: false,
      code: "fetch_failed",
      error:
        "Couldn't reach that page. Check the link or add the item manually.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
