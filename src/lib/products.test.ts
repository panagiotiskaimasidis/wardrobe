import { describe, it, expect } from "vitest";

import {
  parseColorTags,
  serializeColorTags,
  normalizeCategory,
} from "./products";

describe("parseColorTags", () => {
  it("parses a JSON array of strings", () => {
    expect(parseColorTags('["black","white"]')).toEqual(["black", "white"]);
  });

  it("lowercases and trims tags", () => {
    expect(parseColorTags('[" Navy ","CREAM"]')).toEqual(["navy", "cream"]);
  });

  it("drops non-strings and empties", () => {
    expect(parseColorTags('["red", 5, "", null]')).toEqual(["red"]);
  });

  it("returns [] for null, empty, or invalid JSON", () => {
    expect(parseColorTags(null)).toEqual([]);
    expect(parseColorTags("")).toEqual([]);
    expect(parseColorTags("not json")).toEqual([]);
    expect(parseColorTags('{"a":1}')).toEqual([]);
  });
});

describe("serializeColorTags", () => {
  it("dedupes, lowercases, and drops empties", () => {
    expect(serializeColorTags(["Black", "black", " ", "White"])).toBe(
      '["black","white"]',
    );
  });

  it("round-trips with parseColorTags", () => {
    const input = ["Red", "blue"];
    expect(parseColorTags(serializeColorTags(input))).toEqual(["red", "blue"]);
  });
});

describe("normalizeCategory", () => {
  it("keeps known categories", () => {
    expect(normalizeCategory("footwear")).toBe("footwear");
  });

  it("falls back to 'other' for unknown or null", () => {
    expect(normalizeCategory("hats")).toBe("other");
    expect(normalizeCategory(null)).toBe("other");
    expect(normalizeCategory(undefined)).toBe("other");
  });
});
