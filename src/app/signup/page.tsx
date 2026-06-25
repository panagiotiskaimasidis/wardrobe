import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/collections");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Create your Wardrobe
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick a handle and start curating.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
