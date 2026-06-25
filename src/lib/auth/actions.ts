"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";

/** Sign the current user out and return to the landing page. */
export async function signOutAction() {
  await clearSessionCookie();
  redirect("/");
}

/**
 * Dev-only quick login: sign in as a seeded demo user by id, no password.
 * Available because the app must be usable without external OAuth in dev.
 */
export async function devLoginAs(
  userId: string,
): Promise<ActionResult<undefined>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "Unknown user." };
  await setSessionCookie(user.id);
  return { ok: true, data: undefined };
}

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

/** Email + password login against the seeded credentials. */
export async function loginWithCredentials(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid credentials.",
    };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) {
    return { ok: false, error: "No account with that email." };
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Incorrect password." };

  await setSessionCookie(user.id);
  return { ok: true, data: undefined };
}
