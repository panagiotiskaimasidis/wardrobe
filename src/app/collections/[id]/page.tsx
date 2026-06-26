import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Users, Globe } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import {
  getCollectionDetail,
  getCollectionOptions,
} from "@/lib/queries/collections";
import { getCollectionSocial } from "@/lib/queries/social";
import { VISIBILITY_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { BoardEditor } from "@/components/board/board-editor";
import { CollectionHeaderActions } from "@/components/collection-header-actions";
import { CollectionSocial } from "@/components/collection-social";
import { SaveToClosetButton } from "@/components/save-to-closet-button";

const VIS_ICON = { public: Globe, friends: Users, private: Lock } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  const collection = await getCollectionDetail(id, user?.id ?? null);
  return { title: collection?.title ?? "Closet" };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const collection = await getCollectionDetail(id, user?.id ?? null);
  if (!collection) notFound();

  const VisIcon = VIS_ICON[collection.visibility];

  const otherCollections = collection.canEdit
    ? (await getCollectionOptions(collection.owner.id)).filter(
        (c) => c.id !== collection.id,
      )
    : [];

  const social = await getCollectionSocial(collection.id, user?.id ?? null);
  const canResave = !!user && !collection.canEdit;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {collection.title}
            </h1>
            <Badge variant="secondary" className="gap-1">
              <VisIcon className="h-3 w-3" />
              {VISIBILITY_LABELS[collection.visibility]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            <Link
              href={`/u/${collection.owner.handle}`}
              className="hover:underline"
            >
              @{collection.owner.handle}
            </Link>{" "}
            · {collection.itemCount} item
            {collection.itemCount === 1 ? "" : "s"}
          </p>
          {collection.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {collection.description}
            </p>
          )}
        </div>

        {collection.canEdit && (
          <CollectionHeaderActions
            collection={{
              id: collection.id,
              title: collection.title,
              description: collection.description,
              visibility: collection.visibility,
            }}
          />
        )}
      </div>

      {collection.canEdit ? (
        <BoardEditor
          // Remount (resetting local DnD state to server truth) whenever the
          // canonical item set changes after a server refresh.
          key={collection.items.map((i) => i.id).join(",")}
          collectionId={collection.id}
          initialItems={collection.items}
          otherCollections={otherCollections}
        />
      ) : collection.items.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed py-16 text-center">
          This closet is empty.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {collection.items.map((item) => (
            <ProductCard
              key={item.id}
              product={item.product}
              footer={
                canResave ? (
                  <div className="pt-2">
                    <SaveToClosetButton
                      productId={item.product.id}
                      label="Save to my closet"
                    />
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      <CollectionSocial
        collectionId={collection.id}
        initial={social}
        canInteract={!!user}
      />
    </div>
  );
}
