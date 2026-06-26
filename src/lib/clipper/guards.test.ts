import { describe, it, expect } from "vitest";

import { isBlockedHost, validateUrl, pathIsDisallowed } from "./guards";

describe("isBlockedHost", () => {
  it("blocks loopback, private, and link-local hosts", () => {
    for (const h of [
      "localhost",
      "127.0.0.1",
      "10.0.0.5",
      "192.168.1.1",
      "172.16.0.1",
      "169.254.169.254",
      "router",
      "db.internal",
      "::1",
    ]) {
      expect(isBlockedHost(h)).toBe(true);
    }
  });

  it("allows public hosts", () => {
    for (const h of ["example.com", "shop.nike.com", "8.8.8.8", "172.15.0.1"]) {
      expect(isBlockedHost(h)).toBe(false);
    }
  });
});

describe("validateUrl", () => {
  it("accepts http(s) URLs", () => {
    expect(validateUrl("https://example.com/x")?.hostname).toBe("example.com");
    expect(validateUrl("  http://a.com  ")?.protocol).toBe("http:");
  });

  it("rejects non-http protocols and junk", () => {
    expect(validateUrl("ftp://example.com")).toBeNull();
    expect(validateUrl("javascript:alert(1)")).toBeNull();
    expect(validateUrl("not a url")).toBeNull();
  });
});

describe("pathIsDisallowed", () => {
  const robots = `
User-agent: *
Disallow: /cart
Disallow: /checkout

User-agent: BadBot
Disallow: /
`;

  it("disallows matching paths under the wildcard group", () => {
    expect(pathIsDisallowed(robots, "/cart")).toBe(true);
    expect(pathIsDisallowed(robots, "/checkout/step1")).toBe(true);
  });

  it("allows non-matching paths", () => {
    expect(pathIsDisallowed(robots, "/products/shoe")).toBe(false);
  });

  it("treats empty Disallow as allow-all", () => {
    expect(pathIsDisallowed("User-agent: *\nDisallow:", "/anything")).toBe(
      false,
    );
  });

  it("ignores groups for other named bots", () => {
    expect(pathIsDisallowed(robots, "/")).toBe(false);
  });
});
