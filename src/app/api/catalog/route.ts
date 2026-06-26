import { NextResponse } from "next/server";

import { getCatalogProducts } from "@/lib/queries/products";
import { CATEGORIES, type Category } from "@/lib/constants";

export const runtime = "nodejs";

/** GET /api/catalog?q=&category=&page= — JSON product search for the board panel. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const page = await getCatalogProducts({
    q: searchParams.get("q") ?? undefined,
    category:
      category && CATEGORIES.includes(category as Category)
        ? (category as Category)
        : undefined,
    page: Number(searchParams.get("page")) || 1,
    pageSize: 24,
  });
  return NextResponse.json(page);
}
