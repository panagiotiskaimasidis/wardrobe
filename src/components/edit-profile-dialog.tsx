"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateProfile } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditProfileDialog({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: {
    name: string;
    handle: string;
    bio: string | null;
    avatarUrl: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: profile.name,
    handle: profile.handle,
    bio: profile.bio ?? "",
    avatarUrl: profile.avatarUrl ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile(form);
    setSaving(false);
    if (res.ok) {
      toast.success("Profile updated");
      setOpen(false);
      if (res.data.handle !== profile.handle) {
        router.push(`/u/${res.data.handle}`);
      } else {
        router.refresh();
      }
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update how you appear across Wardrobe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-handle">Handle</Label>
            <Input
              id="p-handle"
              value={form.handle}
              onChange={(e) =>
                set("handle", e.target.value.toLowerCase().replace(/\s/g, ""))
              }
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-bio">Bio</Label>
            <Textarea
              id="p-bio"
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              maxLength={280}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-avatar">Avatar URL</Label>
            <Input
              id="p-avatar"
              value={form.avatarUrl}
              onChange={(e) => set("avatarUrl", e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving
                </>
              ) : (
                "Save profile"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
