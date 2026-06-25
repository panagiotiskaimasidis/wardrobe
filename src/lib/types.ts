import type { Category, Visibility } from "@/lib/constants";

/** A product flattened for rendering on the client (no Prisma types leak out). */
export type ProductView = {
  id: string;
  title: string;
  description: string | null;
  brandId: string;
  brandName: string;
  brandSlug: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  category: Category;
  colorTags: string[];
};

/** An item inside a collection (a product plus its placement). */
export type CollectionItemView = {
  id: string;
  position: number;
  note: string | null;
  product: ProductView;
};

/** Author summary used across collections, comments, and the feed. */
export type UserSummary = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
};

export type CollectionView = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  visibility: Visibility;
  owner: UserSummary;
  itemCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};
