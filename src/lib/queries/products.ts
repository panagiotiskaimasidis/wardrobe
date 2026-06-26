import { prisma } from "@/lib/db";
import { normalizeCategory, parseColorTags } from "@/lib/products";
import { CATEGORIES, type Category } from "@/lib/constants";
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

export type CatalogFilters = {
  q?: string;
  category?: Category;
  brand?: string; // brand slug
  color?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
};

export type CatalogPage = {
  products: ProductView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    // SQLite LIKE is case-insensitive for ASCII; no `mode` arg (unsupported).
    and.push({
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { brand: { name: { contains: q } } },
      ],
    });
  }
  if (filters.category && CATEGORIES.includes(filters.category)) {
    and.push({ category: filters.category });
  }
  if (filters.brand?.trim()) {
    and.push({ brand: { slug: filters.brand.trim() } });
  }
  if (filters.color?.trim()) {
    // colorTags is a JSON string like ["red","blue"]; substring match is enough.
    and.push({
      colorTags: { contains: `"${filters.color.trim().toLowerCase()}"` },
    });
  }

  if (and.length) where.AND = and;
  return where;
}

function buildOrderBy(
  sort: CatalogFilters["sort"],
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

/** Filtered, paginated catalog query. */
export async function getCatalogProducts(
  filters: CatalogFilters,
): Promise<CatalogPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(96, Math.max(1, filters.pageSize ?? 24));
  const where = buildWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { brand: true },
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map(toProductView),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Brands with product counts, for the catalog filter sidebar. */
export async function getBrandsWithCounts(): Promise<
  { name: string; slug: string; count: number }[]
> {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true, _count: { select: { products: true } } },
  });
  return brands
    .map((b) => ({ name: b.name, slug: b.slug, count: b._count.products }))
    .filter((b) => b.count > 0);
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
