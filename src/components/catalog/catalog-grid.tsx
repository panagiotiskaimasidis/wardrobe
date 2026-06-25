import { PackageOpen } from "lucide-react";

import type { ProductView } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

export function CatalogGrid({
  products,
  renderFooter,
}: {
  products: ProductView[];
  /** Optional per-card action row (e.g. add-to-closet in later phases). */
  renderFooter?: (product: ProductView) => React.ReactNode;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-20 text-center">
        <PackageOpen className="text-muted-foreground h-10 w-10" />
        <p className="font-medium">No items match those filters.</p>
        <p className="text-muted-foreground text-sm">
          Try clearing a filter, or clip a new item with “Add item”.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} footer={renderFooter?.(p)} />
      ))}
    </div>
  );
}
