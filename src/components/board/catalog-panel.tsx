"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useDraggable } from "@dnd-kit/core";
import { Search, ImageOff, Check, GripVertical } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import type { ProductView } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ALL = "all";

function CatalogDraggable({
  product,
  added,
}: {
  product: ProductView;
  added: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${product.id}`,
    data: { type: "catalog", product },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group bg-card relative flex cursor-grab flex-col overflow-hidden rounded-lg border text-left shadow-sm transition active:cursor-grabbing",
        isDragging && "opacity-40",
        added && "ring-primary/40 ring-2",
      )}
      aria-label={`Drag ${product.title} onto the board`}
    >
      <div className="bg-muted relative aspect-square w-full overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="120px"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
        <div className="bg-background/80 absolute top-1 left-1 rounded p-0.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
        {added && (
          <div className="bg-primary text-primary-foreground absolute top-1 right-1 rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <div className="p-1.5">
        <p className="text-muted-foreground truncate text-[10px] uppercase">
          {product.brandName}
        </p>
        <p className="line-clamp-1 text-xs font-medium">{product.title}</p>
        <p className="text-xs font-semibold">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </div>
  );
}

export function CatalogPanel({ presentIds }: { presentIds: Set<string> }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);

  const { data, isLoading } = useQuery({
    queryKey: ["board-catalog", q, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category !== ALL) params.set("category", category);
      const res = await fetch(`/api/catalog?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load catalog");
      return (await res.json()) as { products: ProductView[] };
    },
  });

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Catalog</h2>
        <p className="text-muted-foreground text-xs">
          Drag items onto your closet →
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items…"
            className="pl-8"
            aria-label="Search catalog to add"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filter catalog by category">
            <SelectValue />
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
      </div>

      <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        {!isLoading &&
          data?.products.map((p) => (
            <CatalogDraggable
              key={p.id}
              product={p}
              added={presentIds.has(p.id)}
            />
          ))}
        {!isLoading && data?.products.length === 0 && (
          <p className="text-muted-foreground col-span-2 py-8 text-center text-sm">
            No items found.
          </p>
        )}
      </div>
    </div>
  );
}
