import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getCollectionOptions } from "@/lib/queries/collections";

export const runtime = "nodejs";

/** GET /api/my/collections — the signed-in user's closets, for "save to" pickers. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ collections: [] }, { status: 401 });
  }
  const collections = await getCollectionOptions(user.id);
  return NextResponse.json({ collections });
}
