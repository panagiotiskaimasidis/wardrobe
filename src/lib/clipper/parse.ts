import { parse, type HTMLElement } from "node-html-parser";

import { normalizeCategory } from "@/lib/products";
import type { Category } from "@/lib/constants";

export type ParsedProduct = {
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  brandName: string;
  sourceUrl: string;
  category: Category;
  colorTags: string[];
};

/**
 * Ordered keyword → category map for a best-effort guess from the title.
 * Substring matching (not word boundaries) so compounds and plurals work:
 * "overcoat" → outerwear, "boots" → footwear, "shorts" → bottoms.
 * Order matters: more specific categories are checked first.
 */
const CATEGORY_KEYWORDS: [string[], Category][] = [
  [["dress", "gown", "frock"], "dresses"],
  [
    [
      "coat",
      "jacket",
      "parka",
      "blazer",
      "trench",
      "bomber",
      "puffer",
      "outerwear",
      "cardigan",
      "anorak",
    ],
    "outerwear",
  ],
  [
    [
      "shoe",
      "sneaker",
      "boot",
      "loafer",
      "sandal",
      "heel",
      "trainer",
      "derby",
      "mule",
      "footwear",
    ],
    "footwear",
  ],
  [
    [
      "pant",
      "trouser",
      "jean",
      "short",
      "chino",
      "skirt",
      "legging",
      "jogger",
      "bottom",
    ],
    "bottoms",
  ],
  [
    [
      "belt",
      "bag",
      "tote",
      "scarf",
      "hat",
      "beanie",
      "sunglass",
      "wallet",
      "cap",
      "accessor",
      "glove",
    ],
    "accessories",
  ],
  [
    [
      "shirt",
      "t-shirt",
      "blouse",
      "sweater",
      "hoodie",
      "polo",
      "tank",
      "knit",
      "henley",
      "tee",
      "top",
    ],
    "tops",
  ],
];

const COLOR_WORDS = [
  "black",
  "white",
  "gray",
  "grey",
  "beige",
  "brown",
  "tan",
  "red",
  "burgundy",
  "pink",
  "orange",
  "yellow",
  "green",
  "olive",
  "blue",
  "navy",
  "purple",
  "cream",
  "ivory",
  "denim",
  "khaki",
];

function guessCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const [keywords, cat] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return "other";
}

function guessColors(text: string): string[] {
  const lower = text.toLowerCase();
  const found = COLOR_WORDS.filter((c) =>
    new RegExp(`\\b${c}\\b`).test(lower),
  ).map((c) => (c === "grey" ? "gray" : c));
  return Array.from(new Set(found)).slice(0, 3);
}

function metaContent(root: HTMLElement, selectors: string[]): string | null {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    const content = el?.getAttribute("content")?.trim();
    if (content) return content;
  }
  return null;
}

function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  // Strip currency symbols / thousands separators, keep digits + dot.
  const cleaned = raw.replace(/[^0-9.,]/g, "").replace(/,(?=\d{3}\b)/g, "");
  const normalized = cleaned.replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function hostnameToBrand(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const main = host.split(".")[0] ?? host;
    return main.charAt(0).toUpperCase() + main.slice(1);
  } catch {
    return "Unknown";
  }
}

type JsonLdNode = Record<string, unknown>;

function collectJsonLd(root: HTMLElement): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];
  for (const script of root.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      const data = JSON.parse(script.text);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item && typeof item === "object") {
          nodes.push(item as JsonLdNode);
          const graph = (item as JsonLdNode)["@graph"];
          if (Array.isArray(graph)) {
            nodes.push(...graph.filter((g) => g && typeof g === "object"));
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }
  return nodes;
}

function findProductNode(nodes: JsonLdNode[]): JsonLdNode | null {
  return (
    nodes.find((n) => {
      const t = n["@type"];
      const types = Array.isArray(t) ? t : [t];
      return types.some((x) => typeof x === "string" && /product/i.test(x));
    }) ?? null
  );
}

function asString(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  return null;
}

function extractFromJsonLd(node: JsonLdNode | null): Partial<ParsedProduct> {
  if (!node) return {};
  const out: Partial<ParsedProduct> = {};

  const name = asString(node.name);
  if (name) out.title = name;

  const description = asString(node.description);
  if (description) out.description = description;

  // image can be a string, array, or ImageObject
  const image = node.image;
  if (typeof image === "string") out.imageUrl = image;
  else if (Array.isArray(image) && typeof image[0] === "string")
    out.imageUrl = image[0];
  else if (image && typeof image === "object") {
    const url = asString((image as JsonLdNode).url);
    if (url) out.imageUrl = url;
  }

  // brand can be a string or { name }
  const brand = node.brand;
  if (typeof brand === "string") out.brandName = brand;
  else if (brand && typeof brand === "object") {
    const bn = asString((brand as JsonLdNode).name);
    if (bn) out.brandName = bn;
  }

  // offers can be an object or array
  const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
  if (offers && typeof offers === "object") {
    const o = offers as JsonLdNode;
    const price = parsePrice(asString(o.price) ?? asString(o.lowPrice));
    if (price != null) out.price = price;
    const currency = asString(o.priceCurrency);
    if (currency) out.currency = currency;
  }

  return out;
}

/**
 * Extract a draft product from a product page's HTML, using JSON-LD `Product`,
 * Open Graph, Twitter Card, and plain HTML fallbacks (in that priority order).
 * Pure and deterministic — safe to unit test.
 */
export function extractProductMetadata(
  html: string,
  url: string,
): ParsedProduct {
  const root = parse(html);

  const jsonLd = extractFromJsonLd(findProductNode(collectJsonLd(root)));

  const ogTitle = metaContent(root, [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ]);
  const htmlTitle = root.querySelector("title")?.text?.trim() ?? null;

  const ogImage = metaContent(root, [
    'meta[property="og:image:secure_url"]',
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
  ]);

  const ogDescription = metaContent(root, [
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
    'meta[name="description"]',
  ]);

  const ogSiteName = metaContent(root, [
    'meta[property="og:site_name"]',
    'meta[name="application-name"]',
  ]);

  const ogPrice = metaContent(root, [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[itemprop="price"]',
  ]);
  const ogCurrency = metaContent(root, [
    'meta[property="product:price:currency"]',
    'meta[property="og:price:currency"]',
    'meta[itemprop="priceCurrency"]',
  ]);

  const title = jsonLd.title ?? ogTitle ?? htmlTitle ?? "Untitled item";
  const description =
    (jsonLd.description ?? ogDescription ?? null)?.slice(0, 500) ?? null;
  const imageUrl = jsonLd.imageUrl ?? ogImage ?? null;
  const brandName =
    jsonLd.brandName ?? ogSiteName ?? hostnameToBrand(url) ?? "Unknown";
  const price = jsonLd.price ?? parsePrice(ogPrice);
  const currency = (jsonLd.currency ?? ogCurrency ?? "USD").toUpperCase();

  const haystack = `${title} ${description ?? ""}`;
  const category = normalizeCategory(
    jsonLd.category ?? guessCategory(haystack),
  );
  const colorTags = guessColors(haystack);

  return {
    title: title.slice(0, 200),
    description,
    imageUrl: imageUrl ? resolveUrl(imageUrl, url) : null,
    price: price ?? null,
    currency,
    brandName: brandName.slice(0, 100),
    sourceUrl: url,
    category,
    colorTags,
  };
}

/** Resolve a possibly-relative image URL against the page URL. */
function resolveUrl(maybeRelative: string, base: string): string {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return maybeRelative;
  }
}
