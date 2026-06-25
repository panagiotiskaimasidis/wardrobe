"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";

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
