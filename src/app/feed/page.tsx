import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Rss } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { getFeed } from "@/lib/queries/social";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/feed");

  const items = await getFeed(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Feed</h1>

      {items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <Rss className="h-10 w-10" />
          <p className="font-medium">Your feed is quiet</p>
          <p className="max-w-sm text-sm">
            Follow people to see their new closets, saved items, and reactions
            here.
          </p>
          <Button asChild>
            <Link href="/catalog">Discover items & people</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const row = (
              <div className="hover:bg-accent/50 flex items-center gap-3 rounded-lg p-3 transition-colors">
                <Link href={`/u/${item.actor.handle}`} className="shrink-0">
                  <Avatar className="h-10 w-10">
                    {item.actor.avatarUrl && (
                      <AvatarImage
                        src={item.actor.avatarUrl}
                        alt={item.actor.name}
                      />
                    )}
                    <AvatarFallback>{initials(item.actor.name)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link
                      href={`/u/${item.actor.handle}`}
                      className="font-medium hover:underline"
                    >
                      {item.actor.name}
                    </Link>{" "}
                    <span className="text-muted-foreground">{item.text}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {item.thumbnailUrl && (
                  <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={item.thumbnailUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            );
            return (
              <li key={item.id}>
                {item.href ? <Link href={item.href}>{row}</Link> : row}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
