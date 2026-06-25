"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { devLoginAs, loginWithCredentials } from "@/lib/auth/actions";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type DemoUser = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
};

export function LoginForm({
  demoUsers,
  next,
  demoPassword,
  googleConfigured = false,
}: {
  demoUsers: DemoUser[];
  next: string;
  demoPassword: string;
  googleConfigured?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function finish() {
    startTransition(() => {
      router.replace(next);
      router.refresh();
    });
  }

  function quickLogin(user: DemoUser) {
    startTransition(async () => {
      const res = await devLoginAs(user.id);
      if (res.ok) {
        toast.success(`Signed in as ${user.name}`);
        finish();
      } else {
        toast.error(res.error);
      }
    });
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await loginWithCredentials({ email, password });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Welcome back!");
      finish();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {demoUsers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Demo accounts (one click)
          </p>
          {demoUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={pending}
              onClick={() => quickLogin(u)}
              className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60"
            >
              <Avatar className="h-9 w-9">
                {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                <AvatarFallback>{initials(u.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-muted-foreground text-xs">@{u.handle}</p>
              </div>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={submitCredentials} className="flex flex-col gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ava@wardrobe.test"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={demoPassword}
            required
          />
        </div>
        <Button type="submit" disabled={submitting || pending}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Demo accounts all use the password{" "}
          <code className="font-mono">{demoPassword}</code>.
        </p>
      </form>

      {googleConfigured && (
        <Button variant="outline" asChild>
          <a href="/api/oauth/google">Continue with Google</a>
        </Button>
      )}

      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link href="/signup" className="text-foreground underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
