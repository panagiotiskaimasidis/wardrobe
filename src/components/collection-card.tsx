import Link from "next/link";
import Image from "next/image";
import { Lock, Users, Globe, Heart, MessageCircle, Layers } from "lucide-react";

import { VISIBILITY_LABELS } from "@/lib/constants";
import type { CollectionView } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const VISIBILITY_ICON = {
  public: Globe,
  friends: Users,
  private: Lock,
} as const;

export function CollectionCard({
  collection,
  showOwner = false,
}: {
  collection: CollectionView;
  showOwner?: boolean;
}) {
  const VisIcon = VISIBILITY_ICON[collection.visibility];

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
        {collection.coverImageUrl ? (
          <Image
            src={collection.coverImageUrl}
            alt={collection.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <Layers className="h-10 w-10" />
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 gap-1 backdrop-blur"
        >
          <VisIcon className="h-3 w-3" />
          {VISIBILITY_LABELS[collection.visibility]}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-semibold tracking-tight">{collection.title}</h3>
        {showOwner && (
          <p className="text-muted-foreground text-xs">
            by @{collection.owner.handle}
          </p>
        )}
        {collection.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {collection.description}
          </p>
        )}
        <div className="text-muted-foreground mt-auto flex items-center gap-3 pt-2 text-xs">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {collection.itemCount}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> {collection.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> {collection.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
