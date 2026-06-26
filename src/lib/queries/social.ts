import { prisma } from "@/lib/db";
import type { UserSummary } from "@/lib/types";

const userSummarySelect = {
  id: true,
  name: true,
  handle: true,
  avatarUrl: true,
} as const;

export type FeedItem = {
  id: string;
  verb: string;
  createdAt: string;
  actor: UserSummary;
  text: string;
  href: string | null;
  thumbnailUrl: string | null;
};

function safeJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** Chronological activity from the people `viewerId` follows. */
export async function getFeed(
  viewerId: string,
  take = 50,
): Promise<FeedItem[]> {
  const following = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  const ids = following.map((f) => f.followingId);
  if (ids.length === 0) return [];

  const events = await prisma.activityEvent.findMany({
    where: { actorId: { in: ids } },
    orderBy: { createdAt: "desc" },
    take,
    include: { actor: { select: userSummarySelect } },
  });

  // Batch-load referenced collections for links + thumbnails.
  const collectionIds = new Set<string>();
  for (const e of events) {
    const meta = safeJson(e.metadata);
    if (e.objectType === "collection") collectionIds.add(e.objectId);
    if (typeof meta.collectionId === "string")
      collectionIds.add(meta.collectionId);
  }
  const collections = await prisma.collection.findMany({
    where: { id: { in: [...collectionIds] } },
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
      items: {
        orderBy: { position: "asc" },
        take: 1,
        select: { product: { select: { imageUrl: true } } },
      },
    },
  });
  const colMap = new Map(collections.map((c) => [c.id, c]));
  const coverOf = (id: string | undefined) => {
    if (!id) return null;
    const c = colMap.get(id);
    return c?.coverImageUrl ?? c?.items[0]?.product.imageUrl ?? null;
  };

  return events.map((e) => {
    const meta = safeJson(e.metadata);
    const actorName = e.actor.name;
    let text = `${actorName} did something`;
    let href: string | null = null;
    let thumbnailUrl: string | null = null;

    switch (e.verb) {
      case "created_collection":
        text = `created a new closet “${meta.title ?? "Untitled"}”`;
        href = `/collections/${e.objectId}`;
        thumbnailUrl = coverOf(e.objectId);
        break;
      case "added_item":
        text = `added ${meta.productTitle ?? "an item"} to “${meta.collectionTitle ?? "a closet"}”`;
        href = meta.collectionId ? `/collections/${meta.collectionId}` : null;
        thumbnailUrl = coverOf(meta.collectionId as string | undefined);
        break;
      case "followed":
        text = `started following @${meta.followingHandle ?? "someone"}`;
        href = meta.followingHandle ? `/u/${meta.followingHandle}` : null;
        break;
      case "liked":
        text = `liked a closet`;
        href = `/collections/${e.objectId}`;
        thumbnailUrl = coverOf(e.objectId);
        break;
      case "commented":
        text = meta.preview ? `commented: “${meta.preview}”` : `left a comment`;
        href = `/collections/${e.objectId}`;
        thumbnailUrl = coverOf(e.objectId);
        break;
    }

    return {
      id: e.id,
      verb: e.verb,
      createdAt: e.createdAt.toISOString(),
      actor: e.actor as UserSummary,
      text,
      href,
      thumbnailUrl,
    };
  });
}

export type CommentView = {
  id: string;
  body: string;
  createdAt: string;
  author: UserSummary;
  isOwn: boolean;
};

export type CollectionSocial = {
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
  comments: CommentView[];
};

/** Likes + comments for a collection, from `viewerId`'s perspective. */
export async function getCollectionSocial(
  collectionId: string,
  viewerId: string | null,
): Promise<CollectionSocial> {
  const [likeCount, likedByViewer, comments] = await Promise.all([
    prisma.like.count({
      where: { targetType: "collection", targetId: collectionId },
    }),
    viewerId
      ? prisma.like.findUnique({
          where: {
            userId_targetType_targetId: {
              userId: viewerId,
              targetType: "collection",
              targetId: collectionId,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.comment.findMany({
      where: { targetType: "collection", targetId: collectionId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: userSummarySelect } },
    }),
  ]);

  return {
    likeCount,
    commentCount: comments.length,
    likedByViewer: !!likedByViewer,
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      author: c.user as UserSummary,
      isOwn: c.userId === viewerId,
    })),
  };
}

/** Users who follow `handle` (with viewer's follow state for each). */
export async function getFollowers(handle: string, viewerId: string | null) {
  const user = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    select: { id: true, name: true, handle: true },
  });
  if (!user) return null;

  const rows = await prisma.follow.findMany({
    where: { followingId: user.id },
    orderBy: { createdAt: "desc" },
    include: { follower: { select: userSummarySelect } },
  });
  return {
    user,
    users: await withFollowState(
      rows.map((r) => r.follower),
      viewerId,
    ),
  };
}

/** Users that `handle` follows. */
export async function getFollowing(handle: string, viewerId: string | null) {
  const user = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    select: { id: true, name: true, handle: true },
  });
  if (!user) return null;

  const rows = await prisma.follow.findMany({
    where: { followerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { following: { select: userSummarySelect } },
  });
  return {
    user,
    users: await withFollowState(
      rows.map((r) => r.following),
      viewerId,
    ),
  };
}

export type FollowRow = UserSummary & { isFollowing: boolean; isSelf: boolean };

async function withFollowState(
  users: UserSummary[],
  viewerId: string | null,
): Promise<FollowRow[]> {
  if (!viewerId) {
    return users.map((u) => ({ ...u, isFollowing: false, isSelf: false }));
  }
  const following = await prisma.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: users.map((u) => u.id) },
    },
    select: { followingId: true },
  });
  const set = new Set(following.map((f) => f.followingId));
  return users.map((u) => ({
    ...u,
    isFollowing: set.has(u.id),
    isSelf: u.id === viewerId,
  }));
}
