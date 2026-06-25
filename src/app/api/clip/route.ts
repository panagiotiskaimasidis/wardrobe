import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { clipInputSchema } from "@/lib/validation";
import { fetchProductMetadata } from "@/lib/clipper/fetch";

export const runtime = "nodejs";

/**
 * POST /api/clip — fetch a product page and return extracted draft metadata.
 * Only reads public OG/JSON-LD/Twitter metadata; respects robots.txt and
 * blocks private hosts (see lib/clipper).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to clip items." },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = clipInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid URL." },
      { status: 400 },
    );
  }

  const result = await fetchProductMetadata(parsed.data.url);
  if (!result.ok) {
    // 200 with ok:false so the client can show the manual-entry fallback.
    return NextResponse.json(result, { status: 200 });
  }
  return NextResponse.json(result, { status: 200 });
}
