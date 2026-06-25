import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil, Layers } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { getProfileByHandle } from "@/lib/queries/users";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CollectionCard } from "@/components/collection-card";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { FollowButton } from "@/components/follow-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle}` };
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const viewer = await getCurrentUser();
  const profile = await getProfileByHandle(handle, viewer?.id ?? null);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Avatar className="h-24 w-24 text-2xl">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
          )}
          <AvatarFallback>{initials(profile.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.name}
            </h1>
            {profile.isSelf ? (
              <EditProfileDialog
                profile={{
                  name: profile.name,
                  handle: profile.handle,
                  bio: profile.bio,
                  avatarUrl: profile.avatarUrl,
                }}
              >
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" /> Edit profile
                </Button>
              </EditProfileDialog>
            ) : (
              viewer && (
                <FollowButton
                  userId={profile.id}
                  handle={profile.handle}
                  initialFollowing={profile.isFollowing}
                />
              )
            )}
          </div>
          <p className="text-muted-foreground">@{profile.handle}</p>
          {profile.bio && <p className="mt-2 max-w-2xl">{profile.bio}</p>}

          <div className="mt-4 flex gap-6">
            <Stat label="items" value={profile.counts.items} />
            <Stat label="closets" value={profile.counts.collections} />
            <Stat label="followers" value={profile.counts.followers} />
            <Stat label="following" value={profile.counts.following} />
          </div>
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-xl font-semibold tracking-tight">
        {profile.isSelf ? "Your closets" : "Closets"}
      </h2>

      {profile.collections.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Layers className="h-8 w-8" />
          <p>No closets to show yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      )}
    </div>
  );
}
