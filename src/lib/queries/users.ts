import { prisma } from "@/lib/db";
import { getUserCollections } from "@/lib/queries/collections";
import type { CollectionView } from "@/lib/types";

export type ProfileView = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  counts: {
    collections: number;
    items: number;
    followers: number;
    following: number;
  };
  collections: CollectionView[];
  isSelf: boolean;
  isFollowing: boolean;
};

/** Full public profile for `/u/[handle]`, scoped to what `viewerId` can see. */
export async function getProfileByHandle(
  handle: string,
  viewerId: string | null,
): Promise<ProfileView | null> {
  const user = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    select: {
      id: true,
      name: true,
      handle: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const isSelf = viewerId === user.id;

  const [followers, following, items, isFollowing, collections] =
    await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.collectionItem.count({
        where: { collection: { ownerId: user.id } },
      }),
      viewerId && !isSelf
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerId,
                followingId: user.id,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      getUserCollections(user.id, viewerId),
    ]);

  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    counts: {
      collections: collections.length,
      items,
      followers,
      following,
    },
    collections,
    isSelf,
    isFollowing: !!isFollowing,
  };
}
