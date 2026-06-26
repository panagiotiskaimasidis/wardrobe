import { describe, it, expect } from "vitest";

import { extractProductMetadata } from "./parse";

const URL = "https://shop.example.com/products/wool-coat";

describe("extractProductMetadata — JSON-LD", () => {
  it("extracts a Product from JSON-LD with offers and brand", () => {
    const html = `<html><head>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Camel Wool Overcoat",
        "description": "A timeless overcoat in pure wool.",
        "image": ["https://cdn.example.com/coat.jpg"],
        "brand": { "@type": "Brand", "name": "North Field" },
        "offers": { "@type": "Offer", "price": "289.00", "priceCurrency": "GBP" }
      }
      </script>
    </head><body></body></html>`;
    const p = extractProductMetadata(html, URL);
    expect(p.title).toBe("Camel Wool Overcoat");
    expect(p.brandName).toBe("North Field");
    expect(p.price).toBe(289);
    expect(p.currency).toBe("GBP");
    expect(p.imageUrl).toBe("https://cdn.example.com/coat.jpg");
    expect(p.category).toBe("outerwear");
  });

  it("handles @graph arrays and Product type arrays", () => {
    const html = `<html><head>
      <script type="application/ld+json">
      { "@graph": [
        { "@type": "WebSite", "name": "Shop" },
        { "@type": ["Product"], "name": "Linen Shorts", "offers": { "price": 45 } }
      ] }
      </script>
    </head><body></body></html>`;
    const p = extractProductMetadata(html, URL);
    expect(p.title).toBe("Linen Shorts");
    expect(p.price).toBe(45);
    expect(p.category).toBe("bottoms");
  });
});

describe("extractProductMetadata — Open Graph / Twitter", () => {
  it("falls back to OG tags when no JSON-LD", () => {
    const html = `<html><head>
      <meta property="og:title" content="Ribbed Tank Top" />
      <meta property="og:image" content="/img/tank.png" />
      <meta property="og:site_name" content="Lumen" />
      <meta property="og:description" content="A soft white ribbed tank." />
      <meta property="product:price:amount" content="$28.00" />
      <meta property="product:price:currency" content="usd" />
    </head><body></body></html>`;
    const p = extractProductMetadata(html, URL);
    expect(p.title).toBe("Ribbed Tank Top");
    expect(p.brandName).toBe("Lumen");
    expect(p.price).toBe(28);
    expect(p.currency).toBe("USD");
    expect(p.category).toBe("tops");
    expect(p.colorTags).toContain("white");
    // relative image resolved against page URL
    expect(p.imageUrl).toBe("https://shop.example.com/img/tank.png");
  });

  it("uses twitter tags as a secondary source", () => {
    const html = `<html><head>
      <meta name="twitter:title" content="Suede Chelsea Boots" />
      <meta name="twitter:image" content="https://cdn.x.com/boot.jpg" />
    </head><body></body></html>`;
    const p = extractProductMetadata(html, URL);
    expect(p.title).toBe("Suede Chelsea Boots");
    expect(p.imageUrl).toBe("https://cdn.x.com/boot.jpg");
    expect(p.category).toBe("footwear");
  });
});

describe("extractProductMetadata — fallbacks", () => {
  it("falls back to <title> and hostname brand", () => {
    const html = `<html><head><title>Mystery Item</title></head><body></body></html>`;
    const p = extractProductMetadata(html, URL);
    expect(p.title).toBe("Mystery Item");
    expect(p.brandName).toBe("Shop"); // from shop.example.com
    expect(p.imageUrl).toBeNull();
    expect(p.price).toBeNull();
    expect(p.currency).toBe("USD");
    expect(p.category).toBe("other");
  });

  it("never throws on empty/garbage input", () => {
    expect(() => extractProductMetadata("", URL)).not.toThrow();
    const p = extractProductMetadata("<not-html", URL);
    expect(p.title).toBeTruthy();
  });
});
