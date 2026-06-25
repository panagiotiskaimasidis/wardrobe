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

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Handle must be at least 3 characters")
  .max(20, "Handle must be at most 20 characters")
  .regex(
    /^[a-z0-9_]+$/,
    "Handle can only use lowercase letters, numbers, and underscores",
  );

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  handle: handleSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  handle: handleSchema,
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  avatarUrl: z
    .string()
    .trim()
    .url("Avatar must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const collectionInputSchema = z.object({
  title: z.string().trim().min(1, "Give your closet a name").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  visibility: z.enum(VISIBILITIES).default("public"),
});

export type CollectionInput = z.infer<typeof collectionInputSchema>;
