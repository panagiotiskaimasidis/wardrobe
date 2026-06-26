"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  clearSessionCookie,
  requireUser,
  setSessionCookie,
} from "@/lib/auth/session";
import { signupSchema, profileSchema } from "@/lib/validation";
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

/** Create a new account, sign it in, and return the new handle. */
export async function signUp(
  input: unknown,
): Promise<ActionResult<{ handle: string }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }
  const { name, email, handle, password } = parsed.data;

  const [emailTaken, handleTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { handle }, select: { id: true } }),
  ]);
  if (emailTaken) return { ok: false, error: "That email is already in use." };
  if (handleTaken) return { ok: false, error: "That handle is taken." };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      handle,
      passwordHash,
      avatarUrl: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(handle)}`,
    },
    select: { id: true, handle: true },
  });

  await setSessionCookie(user.id);
  return { ok: true, data: { handle: user.handle } };
}

/** Update the signed-in user's profile (name, handle, bio, avatar). */
export async function updateProfile(
  input: unknown,
): Promise<ActionResult<{ handle: string }>> {
  let current;
  try {
    current = await requireUser();
  } catch {
    return { ok: false, error: "Please sign in first." };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }
  const { name, handle, bio, avatarUrl } = parsed.data;

  if (handle !== current.handle) {
    const taken = await prisma.user.findUnique({
      where: { handle },
      select: { id: true },
    });
    if (taken) return { ok: false, error: "That handle is taken." };
  }

  await prisma.user.update({
    where: { id: current.id },
    data: {
      name,
      handle,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
    },
  });

  return { ok: true, data: { handle } };
}
