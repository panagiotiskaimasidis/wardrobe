/** Shared enum-like constants. SQLite has no native enums, so these string
 * unions are the single source of truth, validated by Zod at every boundary. */

export const CATEGORIES = [
  "tops",
  "bottoms",
  "outerwear",
  "footwear",
  "accessories",
  "dresses",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  footwear: "Footwear",
  accessories: "Accessories",
  dresses: "Dresses",
  other: "Other",
};

export const VISIBILITIES = ["public", "friends", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: "Public",
  friends: "Friends only",
  private: "Private",
};

export const TARGET_TYPES = ["collection", "collectionItem"] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

export const ACTIVITY_VERBS = [
  "created_collection",
  "added_item",
  "liked",
  "commented",
  "followed",
] as const;
export type ActivityVerb = (typeof ACTIVITY_VERBS)[number];

export const COMMON_COLORS = [
  "black",
  "white",
  "gray",
  "beige",
  "brown",
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "navy",
  "cream",
  "denim",
] as const;
