"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";
import { serializeColorTags } from "@/lib/products";
import { productDraftSchema, type ProductDraftInput } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

/** Find an existing brand by slug or create it. */
async function findOrCreateBrand(name: string) {
  const slug = slugify(name);
  return prisma.brand.upsert({
    where: { slug },
    update: {},
    create: { name: name.trim(), slug },
  });
}

/**
 * Persist a clipped or manually-entered product into the catalog, attributing
 * it to the current user. Returns the new product id.
 */
export async function addClippedProduct(
  input: ProductDraftInput,
): Promise<ActionResult<{ productId: string }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Please sign in to add items." };
  }

  const parsed = productDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid product details.",
    };
  }
  const d = parsed.data;

  const brand = await findOrCreateBrand(d.brandName);

  const product = await prisma.product.create({
    data: {
      brandId: brand.id,
      title: d.title,
      description: d.description || null,
      price: d.price ?? null,
      currency: d.currency,
      imageUrl: d.imageUrl || null,
      sourceUrl: d.sourceUrl || null,
      category: d.category,
      colorTags: serializeColorTags(d.colorTags),
      addedById: user.id,
    },
  });

  revalidatePath("/catalog");
  return { ok: true, data: { productId: product.id } };
}
