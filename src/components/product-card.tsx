import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { ProductView } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function ProductCard({
  product,
  className,
  footer,
}: {
  product: ProductView;
  className?: string;
  /** Optional action row rendered at the bottom (e.g. add / re-save buttons). */
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 capitalize backdrop-blur"
        >
          {CATEGORY_LABELS[product.category]}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {product.brandName}
        </p>
        <p className="line-clamp-2 text-sm font-medium" title={product.title}>
          {product.title}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-sm font-semibold">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.colorTags[0] && (
            <span className="text-muted-foreground text-xs capitalize">
              {product.colorTags.slice(0, 2).join(", ")}
            </span>
          )}
        </div>
        {footer}
      </div>
    </div>
  );
}
