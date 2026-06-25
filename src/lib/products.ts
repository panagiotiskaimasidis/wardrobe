import { CATEGORIES, type Category } from "@/lib/constants";

/** Parse the JSON-encoded colorTags column into a clean string array. */
export function parseColorTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Serialize a list of color tags for storage. */
export function serializeColorTags(tags: string[]): string {
  const cleaned = Array.from(
    new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  );
  return JSON.stringify(cleaned);
}

/** Coerce an arbitrary string into a known category, defaulting to "other". */
export function normalizeCategory(value: string | null | undefined): Category {
  if (value && (CATEGORIES as readonly string[]).includes(value)) {
    return value as Category;
  }
  return "other";
}
