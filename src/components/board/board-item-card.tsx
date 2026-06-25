"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, ImageOff } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import type { CollectionItemView } from "@/lib/types";

export function BoardItemCard({
  item,
  editable,
  onRemove,
}: {
  item: CollectionItemView;
  editable: boolean;
  onRemove?: (itemId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: "item", item },
    disabled: !editable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { product } = item;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card relative flex flex-col overflow-hidden rounded-xl border shadow-sm",
        isDragging && "opacity-40",
      )}
    >
      <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        {editable && (
          <>
            <button
              type="button"
              className="bg-background/80 absolute top-1.5 left-1.5 cursor-grab rounded-md p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 active:cursor-grabbing"
              aria-label="Drag to reorder or move"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove?.(item.id)}
              onPointerDown={(e) => e.stopPropagation()}
              className="bg-background/80 hover:text-destructive absolute top-1.5 right-1.5 rounded-md p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
              aria-label={`Remove ${product.title}`}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          {product.brandName}
        </p>
        <p className="line-clamp-1 text-sm font-medium">{product.title}</p>
        <span className="text-sm font-semibold">
          {formatPrice(product.price, product.currency)}
        </span>
      </div>
    </div>
  );
}
