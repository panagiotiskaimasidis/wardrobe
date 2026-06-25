"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { signUp } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    handle: "",
    password: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await signUp(form);
    setSubmitting(false);
    if (res.ok) {
      toast.success("Welcome to Wardrobe!");
      startTransition(() => {
        router.replace("/collections");
        router.refresh();
      });
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ada Lovelace"
          required
          autoFocus
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="handle">Handle</Label>
        <div className="flex items-center">
          <span className="text-muted-foreground border-input rounded-l-md border border-r-0 px-2.5 py-1.5 text-sm">
            @
          </span>
          <Input
            id="handle"
            value={form.handle}
            onChange={(e) =>
              set("handle", e.target.value.toLowerCase().replace(/\s/g, ""))
            }
            placeholder="ada"
            className="rounded-l-none"
            required
          />
        </div>
        <p className="text-muted-foreground text-xs">
          3–20 chars: lowercase letters, numbers, underscores.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input
          id="su-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="ada@example.com"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="su-password">Password</Label>
        <Input
          id="su-password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          placeholder="At least 8 characters"
          required
        />
      </div>
      <Button type="submit" disabled={submitting || pending}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Creating account
          </>
        ) : (
          "Create account"
        )}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
