import { prisma } from "@/lib/db";
import { normalizeCategory, parseColorTags } from "@/lib/products";
import type { ProductView } from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";

type ProductWithBrand = Prisma.ProductGetPayload<{
  include: { brand: true };
}>;

/** Map a Prisma product (with brand) into a client-safe ProductView. */
export function toProductView(p: ProductWithBrand): ProductView {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    brandId: p.brandId,
    brandName: p.brand.name,
    brandSlug: p.brand.slug,
    price: p.price,
    currency: p.currency,
    imageUrl: p.imageUrl,
    sourceUrl: p.sourceUrl,
    category: normalizeCategory(p.category),
    colorTags: parseColorTags(p.colorTags),
  };
}

/** Most recently added products. */
export async function getRecentProducts(take = 6): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    include: { brand: true },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toProductView);
}

/** Catalog-wide counts for landing/empty states. */
export async function getCatalogStats() {
  const [products, brands, collections] = await Promise.all([
    prisma.product.count(),
    prisma.brand.count(),
    prisma.collection.count({ where: { visibility: "public" } }),
  ]);
  return { products, brands, collections };
}
