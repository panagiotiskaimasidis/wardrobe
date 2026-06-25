"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { LayoutGrid, FolderInput, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { CollectionItemView, ProductView } from "@/lib/types";
import {
  addItemToCollection,
  moveItemToCollection,
  removeItemFromCollection,
  reorderCollectionItems,
} from "@/lib/actions/collections";
import { BoardItemCard } from "@/components/board/board-item-card";
import { CatalogPanel } from "@/components/board/catalog-panel";

type ActiveDrag =
  | { type: "item"; item: CollectionItemView }
  | { type: "catalog"; product: ProductView }
  | null;

type OtherCollection = { id: string; title: string; itemCount: number };

let tempCounter = 0;

export function BoardEditor({
  collectionId,
  initialItems,
  otherCollections,
}: {
  collectionId: string;
  initialItems: CollectionItemView[];
  otherCollections: OtherCollection[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<CollectionItemView[]>(initialItems);
  const [active, setActive] = useState<ActiveDrag>(null);
  const copyMode = useRef(false);

  // Track the Alt/Option key to switch move → copy when dropping on a closet.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Alt") copyMode.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Alt") copyMode.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const presentIds = new Set(items.map((i) => i.product.id));

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current;
    if (data?.type === "item") setActive({ type: "item", item: data.item });
    else if (data?.type === "catalog")
      setActive({ type: "catalog", product: data.product });
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active: a, over } = e;
    setActive(null);
    if (!over) return;
    const data = a.data.current;

    if (data?.type === "catalog") {
      await addProduct(data.product as ProductView);
      return;
    }

    if (data?.type === "item") {
      const overData = over.data.current;
      if (overData?.type === "collection-target") {
        await moveItem(
          String(a.id),
          overData.collectionId as string,
          copyMode.current ? "copy" : "move",
        );
        return;
      }
      // Reorder within the board.
      if (a.id !== over.id && items.some((i) => i.id === over.id)) {
        const oldIndex = items.findIndex((i) => i.id === a.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const next = arrayMove(items, oldIndex, newIndex);
        setItems(next);
        const res = await reorderCollectionItems({
          collectionId,
          orderedItemIds: next.map((i) => i.id),
        });
        if (!res.ok) {
          toast.error(res.error);
          router.refresh();
        }
      }
    }
  }

  async function addProduct(product: ProductView) {
    if (presentIds.has(product.id)) {
      toast.info("That item is already in this closet.");
      return;
    }
    const tempId = `temp-${++tempCounter}`;
    const optimistic: CollectionItemView = {
      id: tempId,
      position: items.length,
      note: null,
      product,
    };
    setItems((prev) => [...prev, optimistic]);

    const res = await addItemToCollection({
      collectionId,
      productId: product.id,
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === tempId ? { ...i, id: res.data.itemId } : i)),
      );
      toast.success("Added to closet");
    } else {
      setItems((prev) => prev.filter((i) => i.id !== tempId));
      toast.error(res.error);
    }
  }

  async function moveItem(
    itemId: string,
    targetCollectionId: string,
    mode: "move" | "copy",
  ) {
    const snapshot = items;
    if (mode === "move") {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
    const res = await moveItemToCollection({
      itemId,
      targetCollectionId,
      mode,
    });
    if (res.ok) {
      const target = otherCollections.find((c) => c.id === targetCollectionId);
      toast.success(
        `${mode === "copy" ? "Copied" : "Moved"} to “${target?.title ?? "closet"}”`,
      );
      router.refresh();
    } else {
      setItems(snapshot);
      toast.error(res.error);
    }
  }

  async function handleRemove(itemId: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    const res = await removeItemFromCollection(itemId);
    if (!res.ok) {
      setItems(snapshot);
      toast.error(res.error);
    } else {
      toast.success("Removed from closet");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <BoardDropArea isEmpty={items.length === 0}>
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                  <BoardItemCard
                    key={item.id}
                    item={item}
                    editable
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </BoardDropArea>

          {otherCollections.length > 0 && (
            <div className="rounded-xl border border-dashed p-3">
              <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                <FolderInput className="h-3.5 w-3.5" />
                Drag an item here to move it (hold{" "}
                <kbd className="bg-muted rounded px-1">Alt</kbd> to copy)
              </p>
              <div className="flex flex-wrap gap-2">
                {otherCollections.map((c) => (
                  <CollectionTarget key={c.id} collection={c} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="bg-muted/30 h-fit rounded-xl border p-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
          <CatalogPanel presentIds={presentIds} />
        </aside>
      </div>

      <DragOverlay>
        {active?.type === "item" && (
          <DragPreview
            title={active.item.product.title}
            brand={active.item.product.brandName}
            imageUrl={active.item.product.imageUrl}
          />
        )}
        {active?.type === "catalog" && (
          <DragPreview
            title={active.product.title}
            brand={active.product.brandName}
            imageUrl={active.product.imageUrl}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function BoardDropArea({
  isEmpty,
  children,
}: {
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "board" });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl transition-colors",
        isEmpty &&
          "flex min-h-[240px] flex-col items-center justify-center gap-2 border-2 border-dashed text-center",
        isOver && "bg-primary/5 ring-primary/40 ring-2",
      )}
    >
      {isEmpty ? (
        <>
          <LayoutGrid className="text-muted-foreground h-10 w-10" />
          <p className="font-medium">This closet is empty</p>
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <Sparkles className="h-3.5 w-3.5" /> Drag items from the catalog →
          </p>
        </>
      ) : (
        children
      )}
    </div>
  );
}

function CollectionTarget({ collection }: { collection: OtherCollection }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `target-${collection.id}`,
    data: { type: "collection-target", collectionId: collection.id },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
        isOver
          ? "border-primary bg-primary/10"
          : "bg-background hover:bg-accent",
      )}
    >
      <span className="font-medium">{collection.title}</span>
      <span className="text-muted-foreground text-xs">
        {collection.itemCount}
      </span>
    </div>
  );
}

function DragPreview({
  title,
  brand,
  imageUrl,
}: {
  title: string;
  brand: string;
  imageUrl: string | null;
}) {
  return (
    <div className="bg-card w-32 rotate-3 overflow-hidden rounded-xl border shadow-2xl">
      <div className="bg-muted aspect-square w-full overflow-hidden">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-1.5">
        <p className="text-muted-foreground truncate text-[10px] uppercase">
          {brand}
        </p>
        <p className="line-clamp-1 text-xs font-medium">{title}</p>
      </div>
    </div>
  );
}
