import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/catalog`, priority: 0.8 },
  ];

  // Public profiles and public collections are indexable.
  const [users, collections] = await Promise.all([
    prisma.user.findMany({ select: { handle: true }, take: 1000 }),
    prisma.collection.findMany({
      where: { visibility: "public" },
      select: { id: true, updatedAt: true },
      take: 1000,
    }),
  ]);

  return [
    ...staticRoutes,
    ...users.map((u) => ({ url: `${base}/u/${u.handle}`, priority: 0.6 })),
    ...collections.map((c) => ({
      url: `${base}/collections/${c.id}`,
      lastModified: c.updatedAt,
      priority: 0.5,
    })),
  ];
}
