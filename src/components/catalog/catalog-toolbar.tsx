"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

import { CATEGORIES, CATEGORY_LABELS, COMMON_COLORS } from "@/lib/constants";
import type { CatalogFilters } from "@/lib/queries/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

export function CatalogToolbar({
  brands,
  filters,
}: {
  brands: { name: string; slug: string; count: number }[];
  filters: CatalogFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(filters.q ?? "");

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL) params.set(key, value);
      else params.delete(key);
      params.delete("page"); // reset pagination on any filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounce the search box → URL.
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((filters.q ?? "") !== query) setParam("q", query || undefined);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasFilters =
    !!filters.q || !!filters.category || !!filters.brand || !!filters.color;

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or brands…"
            className="pl-8"
            aria-label="Search catalog"
          />
          {isPending && (
            <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>

        <Select
          value={filters.category ?? ALL}
          onValueChange={(v) => setParam("category", v)}
        >
          <SelectTrigger className="w-[150px]" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.brand ?? ALL}
          onValueChange={(v) => setParam("brand", v)}
        >
          <SelectTrigger className="w-[150px]" aria-label="Filter by brand">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.slug} value={b.slug}>
                {b.name} ({b.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.color ?? ALL}
          onValueChange={(v) => setParam("color", v)}
        >
          <SelectTrigger className="w-[130px]" aria-label="Filter by color">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any color</SelectItem>
            {COMMON_COLORS.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort ?? "newest"}
          onValueChange={(v) =>
            setParam("sort", v === "newest" ? undefined : v)
          }
        >
          <SelectTrigger className="w-[150px]" aria-label="Sort">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              startTransition(() => router.push(pathname, { scroll: false }));
            }}
          >
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
