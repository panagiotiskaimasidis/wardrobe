"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import { collectionInputSchema } from "@/lib/validation";
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

/** Verify the current user owns the collection; returns it or null. */
async function assertOwnedCollection(collectionId: string, userId: string) {
  const c = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { id: true, ownerId: true, title: true },
  });
  if (!c || c.ownerId !== userId) return null;
  return c;
}

async function recordActivity(input: {
  actorId: string;
  verb: string;
  objectType: string;
  objectId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityEvent.create({
    data: {
      actorId: input.actorId,
      verb: input.verb,
      objectType: input.objectType,
      objectId: input.objectId,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}

export async function createCollection(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const parsed = collectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }
  const { title, description, visibility } = parsed.data;

  const collection = await prisma.collection.create({
    data: {
      ownerId: auth.user.id,
      title,
      description: description || null,
      visibility,
    },
  });
  await recordActivity({
    actorId: auth.user.id,
    verb: "created_collection",
    objectType: "collection",
    objectId: collection.id,
    metadata: { title, visibility },
  });

  revalidatePath("/collections");
  return { ok: true, data: { id: collection.id } };
}

export async function updateCollection(
  collectionId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const owned = await assertOwnedCollection(collectionId, auth.user.id);
  if (!owned) return { ok: false, error: "Closet not found." };

  const parsed = collectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }
  const { title, description, visibility } = parsed.data;

  await prisma.collection.update({
    where: { id: collectionId },
    data: { title, description: description || null, visibility },
  });

  revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/collections");
  return { ok: true, data: { id: collectionId } };
}

export async function deleteCollection(
  collectionId: string,
): Promise<ActionResult<undefined>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const owned = await assertOwnedCollection(collectionId, auth.user.id);
  if (!owned) return { ok: false, error: "Closet not found." };

  await prisma.collection.delete({ where: { id: collectionId } });
  revalidatePath("/collections");
  return { ok: true, data: undefined };
}

const addSchema = z.object({
  collectionId: z.string().min(1),
  productId: z.string().min(1),
});

export async function addItemToCollection(
  input: unknown,
): Promise<ActionResult<{ itemId: string; alreadyPresent: boolean }>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { collectionId, productId } = parsed.data;

  const owned = await assertOwnedCollection(collectionId, auth.user.id);
  if (!owned) return { ok: false, error: "Closet not found." };

  const existing = await prisma.collectionItem.findUnique({
    where: { collectionId_productId: { collectionId, productId } },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, data: { itemId: existing.id, alreadyPresent: true } };
  }

  const max = await prisma.collectionItem.aggregate({
    where: { collectionId },
    _max: { position: true },
  });
  const position = (max._max.position ?? -1) + 1;

  const item = await prisma.collectionItem.create({
    data: { collectionId, productId, position },
    include: { product: { select: { title: true } } },
  });
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });
  await recordActivity({
    actorId: auth.user.id,
    verb: "added_item",
    objectType: "collectionItem",
    objectId: item.id,
    metadata: {
      collectionId,
      collectionTitle: owned.title,
      productTitle: item.product.title,
    },
  });

  revalidatePath(`/collections/${collectionId}`);
  return { ok: true, data: { itemId: item.id, alreadyPresent: false } };
}

export async function removeItemFromCollection(
  itemId: string,
): Promise<ActionResult<undefined>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const item = await prisma.collectionItem.findUnique({
    where: { id: itemId },
    include: { collection: { select: { id: true, ownerId: true } } },
  });
  if (!item || item.collection.ownerId !== auth.user.id) {
    return { ok: false, error: "Item not found." };
  }

  await prisma.collectionItem.delete({ where: { id: itemId } });
  revalidatePath(`/collections/${item.collection.id}`);
  return { ok: true, data: undefined };
}

const reorderSchema = z.object({
  collectionId: z.string().min(1),
  orderedItemIds: z.array(z.string().min(1)).max(500),
});

export async function reorderCollectionItems(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { collectionId, orderedItemIds } = parsed.data;

  const owned = await assertOwnedCollection(collectionId, auth.user.id);
  if (!owned) return { ok: false, error: "Closet not found." };

  // Only reorder items that actually belong to this collection.
  const items = await prisma.collectionItem.findMany({
    where: { collectionId },
    select: { id: true },
  });
  const valid = new Set(items.map((i) => i.id));

  await prisma.$transaction(
    orderedItemIds
      .filter((id) => valid.has(id))
      .map((id, index) =>
        prisma.collectionItem.update({
          where: { id },
          data: { position: index },
        }),
      ),
  );

  revalidatePath(`/collections/${collectionId}`);
  return { ok: true, data: undefined };
}

const moveSchema = z.object({
  itemId: z.string().min(1),
  targetCollectionId: z.string().min(1),
  mode: z.enum(["move", "copy"]),
});

export async function moveItemToCollection(
  input: unknown,
): Promise<ActionResult<{ mode: "move" | "copy" }>> {
  const auth = await getUserOrError();
  if (!auth.ok) return auth;

  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { itemId, targetCollectionId, mode } = parsed.data;

  const item = await prisma.collectionItem.findUnique({
    where: { id: itemId },
    include: { collection: { select: { id: true, ownerId: true } } },
  });
  if (!item || item.collection.ownerId !== auth.user.id) {
    return { ok: false, error: "Item not found." };
  }
  if (item.collection.id === targetCollectionId) {
    return { ok: false, error: "That item is already in this closet." };
  }

  const target = await assertOwnedCollection(targetCollectionId, auth.user.id);
  if (!target) return { ok: false, error: "Target closet not found." };

  const alreadyThere = await prisma.collectionItem.findUnique({
    where: {
      collectionId_productId: {
        collectionId: targetCollectionId,
        productId: item.productId,
      },
    },
    select: { id: true },
  });

  const max = await prisma.collectionItem.aggregate({
    where: { collectionId: targetCollectionId },
    _max: { position: true },
  });
  const nextPosition = (max._max.position ?? -1) + 1;

  if (mode === "copy") {
    if (!alreadyThere) {
      await prisma.collectionItem.create({
        data: {
          collectionId: targetCollectionId,
          productId: item.productId,
          note: item.note,
          position: nextPosition,
        },
      });
    }
  } else {
    // move
    if (alreadyThere) {
      // Product already in target — just drop the source copy.
      await prisma.collectionItem.delete({ where: { id: item.id } });
    } else {
      await prisma.collectionItem.update({
        where: { id: item.id },
        data: { collectionId: targetCollectionId, position: nextPosition },
      });
    }
  }

  revalidatePath(`/collections/${item.collection.id}`);
  revalidatePath(`/collections/${targetCollectionId}`);
  return { ok: true, data: { mode } };
}
