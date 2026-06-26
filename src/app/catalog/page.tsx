import type { Metadata } from "next";

import {
  getCatalogProducts,
  getBrandsWithCounts,
  type CatalogFilters,
} from "@/lib/queries/products";
import { CATEGORIES, type Category } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { SaveToClosetButton } from "@/components/save-to-closet-button";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse and search fashion items from every brand on Wardrobe.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseFilters(sp: SearchParams): CatalogFilters {
  const category = first(sp.category);
  const sort = first(sp.sort);
  return {
    q: first(sp.q),
    category:
      category && CATEGORIES.includes(category as Category)
        ? (category as Category)
        : undefined,
    brand: first(sp.brand),
    color: first(sp.color),
    sort:
      sort === "price-asc" || sort === "price-desc" || sort === "newest"
        ? sort
        : "newest",
    page: Number(first(sp.page)) || 1,
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const [result, brands, user] = await Promise.all([
    getCatalogProducts(filters),
    getBrandsWithCounts(),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
        <p className="text-muted-foreground mt-1">
          {result.total.toLocaleString()} item
          {result.total === 1 ? "" : "s"} from {brands.length} brands. Drag any
          item onto a closet, or clip your own with “Add item”.
        </p>
      </div>

      <CatalogToolbar brands={brands} filters={filters} />

      <CatalogGrid
        products={result.products}
        renderFooter={
          user
            ? (p) => (
                <div className="pt-2">
                  <SaveToClosetButton productId={p.id} className="w-full" />
                </div>
              )
            : undefined
        }
      />

      <CatalogPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
