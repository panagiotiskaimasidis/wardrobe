import { prisma } from "@/lib/db";
import { toProductView } from "@/lib/queries/products";
import { type Visibility } from "@/lib/constants";
import type {
  CollectionItemView,
  CollectionView,
  UserSummary,
} from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";

const ownerSelect = {
  id: true,
  name: true,
  handle: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

function toVisibility(v: string): Visibility {
  return v === "private" || v === "friends" ? v : "public";
}

/** Whether `viewerId` is allowed to see a collection of the given visibility. */
export async function canViewCollection(
  ownerId: string,
  visibility: string,
  viewerId: string | null,
): Promise<boolean> {
  if (visibility === "public") return true;
  if (!viewerId) return false;
  if (viewerId === ownerId) return true;
  if (visibility === "private") return false;
  // "friends" → viewer must follow the owner (or vice-versa counts as friends).
  const rel = await prisma.follow.findFirst({
    where: {
      OR: [
        { followerId: viewerId, followingId: ownerId },
        { followerId: ownerId, followingId: viewerId },
      ],
    },
    select: { id: true },
  });
  return !!rel;
}

async function countReactions(collectionId: string) {
  const [likeCount, commentCount] = await Promise.all([
    prisma.like.count({
      where: { targetType: "collection", targetId: collectionId },
    }),
    prisma.comment.count({
      where: { targetType: "collection", targetId: collectionId },
    }),
  ]);
  return { likeCount, commentCount };
}

/** Collections owned by a user, optionally filtered to those a viewer can see. */
export async function getUserCollections(
  ownerId: string,
  viewerId: string | null,
): Promise<CollectionView[]> {
  const isOwner = viewerId === ownerId;
  const rows = await prisma.collection.findMany({
    where: { ownerId },
    include: {
      owner: { select: ownerSelect },
      _count: { select: { items: true } },
      items: {
        orderBy: { position: "asc" },
        take: 1,
        include: { product: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const visible: CollectionView[] = [];
  for (const c of rows) {
    if (
      !isOwner &&
      !(await canViewCollection(c.ownerId, c.visibility, viewerId))
    ) {
      continue;
    }
    const { likeCount, commentCount } = await countReactions(c.id);
    visible.push({
      id: c.id,
      title: c.title,
      description: c.description,
      coverImageUrl: c.coverImageUrl ?? c.items[0]?.product.imageUrl ?? null,
      visibility: toVisibility(c.visibility),
      owner: c.owner as UserSummary,
      itemCount: c._count.items,
      likeCount,
      commentCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    });
  }
  return visible;
}

export type CollectionDetail = CollectionView & {
  items: CollectionItemView[];
  canEdit: boolean;
};

/** Full collection with ordered items. Returns null if not found or not viewable. */
export async function getCollectionDetail(
  id: string,
  viewerId: string | null,
): Promise<CollectionDetail | null> {
  const c = await prisma.collection.findUnique({
    where: { id },
    include: {
      owner: { select: ownerSelect },
      items: {
        orderBy: { position: "asc" },
        include: { product: { include: { brand: true } } },
      },
    },
  });
  if (!c) return null;

  const canView = await canViewCollection(c.ownerId, c.visibility, viewerId);
  if (!canView) return null;

  const { likeCount, commentCount } = await countReactions(c.id);

  return {
    id: c.id,
    title: c.title,
    description: c.description,
    coverImageUrl: c.coverImageUrl ?? c.items[0]?.product.imageUrl ?? null,
    visibility: toVisibility(c.visibility),
    owner: c.owner as UserSummary,
    itemCount: c.items.length,
    likeCount,
    commentCount,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    canEdit: viewerId === c.ownerId,
    items: c.items.map((it) => ({
      id: it.id,
      position: it.position,
      note: it.note,
      product: toProductView(it.product),
    })),
  };
}

/** Lightweight list of a user's collections for "move/copy/add to" pickers. */
export async function getCollectionOptions(
  ownerId: string,
): Promise<{ id: string; title: string; itemCount: number }[]> {
  const rows = await prisma.collection.findMany({
    where: { ownerId },
    select: { id: true, title: true, _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    itemCount: r._count.items,
  }));
}
