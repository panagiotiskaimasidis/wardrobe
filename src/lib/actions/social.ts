"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import { commentSchema, likeSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";
import type { UserSummary } from "@/lib/types";

async function getUserOrError(): Promise<
  { ok: true; user: SessionUser } | { ok: false; error: string }
> {
  try {
    return { ok: true, user: await requireUser() };
  } catch {
    return { ok: false, error: "Please sign in first." };
  }
}

export async function followUser(
  targetUserId: string,
): Promise<ActionResult<{ following: boolean }>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;
  if (targetUserId === auth.user.id) {
    return { ok: false, error: "You can't follow yourself." };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, handle: true },
  });
  if (!target) return { ok: false, error: "User not found." };

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: auth.user.id,
        followingId: targetUserId,
      },
    },
    select: { id: true },
  });

  if (!existing) {
    await prisma.follow.create({
      data: { followerId: auth.user.id, followingId: targetUserId },
    });
    await prisma.activityEvent.create({
      data: {
        actorId: auth.user.id,
        verb: "followed",
        objectType: "user",
        objectId: targetUserId,
        metadata: JSON.stringify({ followingHandle: target.handle }),
      },
    });
  }

  revalidatePath(`/u/${target.handle}`);
  return { ok: true, data: { following: true } };
}

export async function unfollowUser(
  targetUserId: string,
): Promise<ActionResult<{ following: boolean }>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { handle: true },
  });

  await prisma.follow.deleteMany({
    where: { followerId: auth.user.id, followingId: targetUserId },
  });

  if (target) revalidatePath(`/u/${target.handle}`);
  return { ok: true, data: { following: false } };
}

/** Toggle a like on a collection or item. Returns the new state + count. */
export async function toggleLike(
  input: unknown,
): Promise<ActionResult<{ liked: boolean; count: number }>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const parsed = likeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { targetType, targetId } = parsed.data;

  const existing = await prisma.like.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: auth.user.id,
        targetType,
        targetId,
      },
    },
    select: { id: true },
  });

  let liked: boolean;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.like.create({
      data: { userId: auth.user.id, targetType, targetId },
    });
    await prisma.activityEvent.create({
      data: {
        actorId: auth.user.id,
        verb: "liked",
        objectType: targetType,
        objectId: targetId,
        metadata: "{}",
      },
    });
    liked = true;
  }

  const count = await prisma.like.count({ where: { targetType, targetId } });
  if (targetType === "collection") revalidatePath(`/collections/${targetId}`);
  return { ok: true, data: { liked, count } };
}

export type NewComment = {
  id: string;
  body: string;
  createdAt: string;
  author: UserSummary;
  isOwn: true;
};

/** Add a comment to a collection or item. */
export async function addComment(
  input: unknown,
): Promise<ActionResult<NewComment>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid comment.",
    };
  }
  const { targetType, targetId, body } = parsed.data;

  const comment = await prisma.comment.create({
    data: { userId: auth.user.id, targetType, targetId, body },
  });
  await prisma.activityEvent.create({
    data: {
      actorId: auth.user.id,
      verb: "commented",
      objectType: targetType,
      objectId: targetId,
      metadata: JSON.stringify({ preview: body.slice(0, 60) }),
    },
  });

  if (targetType === "collection") revalidatePath(`/collections/${targetId}`);
  return {
    ok: true,
    data: {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: auth.user.id,
        name: auth.user.name,
        handle: auth.user.handle,
        avatarUrl: auth.user.avatarUrl,
      },
      isOwn: true,
    },
  };
}

/** Delete one of your own comments. */
export async function deleteComment(
  commentId: string,
): Promise<ActionResult<undefined>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, targetType: true, targetId: true },
  });
  if (!comment || comment.userId !== auth.user.id) {
    return { ok: false, error: "Comment not found." };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  if (comment.targetType === "collection")
    revalidatePath(`/collections/${comment.targetId}`);
  return { ok: true, data: undefined };
}
