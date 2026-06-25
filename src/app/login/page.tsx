import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(next || "/collections");

  const demoUsers = await prisma.user.findMany({
    select: { id: true, name: true, handle: true, avatarUrl: true },
    orderBy: { createdAt: "asc" },
    take: 6,
  });

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Sign in to Wardrobe
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick a demo account for the fastest tour, or use email + password.
        </p>
      </div>
      <LoginForm
        demoUsers={demoUsers}
        next={next ?? "/collections"}
        demoPassword="password123"
      />
    </div>
  );
}
