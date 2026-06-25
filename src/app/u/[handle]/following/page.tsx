import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getFollowing } from "@/lib/queries/social";
import { UserListRow } from "@/components/user-list-row";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle} is following` };
}

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const viewer = await getCurrentUser();
  const data = await getFollowing(handle, viewer?.id ?? null);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/u/${data.user.handle}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← @{data.user.handle}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Following</h1>
      </div>
      {data.users.length === 0 ? (
        <p className="text-muted-foreground">Not following anyone yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.users.map((u) => (
            <UserListRow key={u.id} user={u} showFollow={!!viewer} />
          ))}
        </div>
      )}
    </div>
  );
}
