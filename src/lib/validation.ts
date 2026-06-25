import { z } from "zod";

import { CATEGORIES, VISIBILITIES } from "@/lib/constants";

export const clipInputSchema = z.object({
  url: z.string().trim().url("Enter a valid URL"),
});

/** A product the user is about to save (clipped or manually entered). */
export const productDraftSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  brandName: z.string().trim().min(1, "Brand is required").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z
    .number({ message: "Price must be a number" })
    .nonnegative("Price can't be negative")
    .max(1_000_000)
    .nullable()
    .optional(),
  currency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter code")
    .toUpperCase()
    .default("USD"),
  imageUrl: z
    .string()
    .trim()
    .url("Image must be a valid URL")
    .optional()
    .or(z.literal("")),
  sourceUrl: z
    .string()
    .trim()
    .url("Source must be a valid URL")
    .optional()
    .or(z.literal("")),
  category: z.enum(CATEGORIES).default("other"),
  colorTags: z.array(z.string().trim().toLowerCase()).max(8).default([]),
});

export type ProductDraftInput = z.input<typeof productDraftSchema>;
export type ProductDraft = z.output<typeof productDraftSchema>;

export const collectionInputSchema = z.object({
  title: z.string().trim().min(1, "Give your closet a name").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  visibility: z.enum(VISIBILITIES).default("public"),
});

export type CollectionInput = z.infer<typeof collectionInputSchema>;
