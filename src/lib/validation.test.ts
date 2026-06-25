import { describe, it, expect } from "vitest";

import {
  handleSchema,
  signupSchema,
  productDraftSchema,
  collectionInputSchema,
  commentSchema,
} from "./validation";

describe("handleSchema", () => {
  it("accepts valid handles and lowercases", () => {
    expect(handleSchema.parse("Ava_99")).toBe("ava_99");
  });

  it("rejects too short, too long, and bad characters", () => {
    expect(handleSchema.safeParse("ab").success).toBe(false);
    expect(handleSchema.safeParse("a".repeat(21)).success).toBe(false);
    expect(handleSchema.safeParse("has space").success).toBe(false);
    expect(handleSchema.safeParse("bad-dash").success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts a complete valid signup", () => {
    const r = signupSchema.safeParse({
      name: "Ada",
      email: "ADA@Example.com",
      handle: "ada",
      password: "longenough",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ada@example.com");
  });

  it("rejects short passwords and bad emails", () => {
    expect(
      signupSchema.safeParse({
        name: "Ada",
        email: "nope",
        handle: "ada",
        password: "short",
      }).success,
    ).toBe(false);
  });
});

describe("productDraftSchema", () => {
  it("defaults currency and category, coerces empty optionals", () => {
    const r = productDraftSchema.parse({
      title: "Tee",
      brandName: "Brand",
    });
    expect(r.currency).toBe("USD");
    expect(r.category).toBe("other");
    expect(r.colorTags).toEqual([]);
  });

  it("uppercases currency and rejects invalid category", () => {
    expect(
      productDraftSchema.parse({
        title: "Tee",
        brandName: "B",
        currency: "eur",
      }).currency,
    ).toBe("EUR");
    expect(
      productDraftSchema.safeParse({
        title: "Tee",
        brandName: "B",
        category: "hats",
      }).success,
    ).toBe(false);
  });

  it("requires a title", () => {
    expect(
      productDraftSchema.safeParse({ title: "", brandName: "B" }).success,
    ).toBe(false);
  });
});

describe("collectionInputSchema", () => {
  it("defaults visibility to public", () => {
    expect(collectionInputSchema.parse({ title: "Fall" }).visibility).toBe(
      "public",
    );
  });
});

describe("commentSchema", () => {
  it("rejects empty bodies and bad target types", () => {
    expect(
      commentSchema.safeParse({
        targetType: "collection",
        targetId: "x",
        body: "",
      }).success,
    ).toBe(false);
    expect(
      commentSchema.safeParse({
        targetType: "bogus",
        targetId: "x",
        body: "hi",
      }).success,
    ).toBe(false);
  });
});
