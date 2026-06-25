import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Google OAuth seam (stub). Real OAuth is intentionally not implemented in the
 * MVP — the app runs fully in dev via the credentials/dev login. When
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are configured, wire the standard
 * authorization-code flow here (redirect to Google's consent screen, handle
 * the callback, upsert the user, then `setSessionCookie`). See DECISIONS.md.
 */
export async function GET() {
  const configured = !!process.env.GOOGLE_CLIENT_ID;
  return NextResponse.json(
    {
      ok: false,
      error: configured
        ? "Google OAuth is configured but the flow is not implemented in this MVP. Use the dev login."
        : "Google OAuth is not configured. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, or use the dev login.",
    },
    { status: 501 },
  );
}
