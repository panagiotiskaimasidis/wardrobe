import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/authenticated surfaces out of the index.
      disallow: ["/api/", "/collections", "/feed", "/login", "/signup"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
