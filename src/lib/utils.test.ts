import { describe, it, expect } from "vitest";

import { cn, formatPrice, initials, slugify } from "./utils";

describe("cn", () => {
  it("merges and dedupes conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});

describe("formatPrice", () => {
  it("formats USD by default", () => {
    expect(formatPrice(49.99)).toBe("$49.99");
  });

  it("respects the currency code", () => {
    expect(formatPrice(20, "EUR")).toBe("€20.00");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatPrice(null)).toBe("");
    expect(formatPrice(undefined)).toBe("");
  });
});

describe("initials", () => {
  it("takes the first letter of up to two words", () => {
    expect(initials("Ava Stone")).toBe("AS");
    expect(initials("madonna")).toBe("M");
  });

  it("handles empty input", () => {
    expect(initials("")).toBe("?");
    expect(initials(null)).toBe("?");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Atlas & Oak")).toBe("atlas-oak");
    expect(slugify("North  Field")).toBe("north-field");
  });

  it("strips diacritics and trims separators", () => {
    expect(slugify("Marée")).toBe("maree");
    expect(slugify("  --Hello!!--  ")).toBe("hello");
  });

  it("falls back to 'brand' for empty/symbol-only input", () => {
    expect(slugify("")).toBe("brand");
    expect(slugify("!!!")).toBe("brand");
  });
});
