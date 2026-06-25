"use server";

import { redirect } from "next/navigation";

import { clearSessionCookie } from "@/lib/auth/session";

/** Sign the current user out and return to the landing page. */
export async function signOutAction() {
  await clearSessionCookie();
  redirect("/");
}
