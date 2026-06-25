import Link from "next/link";

import type { FollowRow } from "@/lib/queries/social";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/follow-button";

export function UserListRow({
  user,
  showFollow,
}: {
  user: FollowRow;
  showFollow: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Link href={`/u/${user.handle}`}>
        <Avatar className="h-10 w-10">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          )}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
      </Link>
      <Link href={`/u/${user.handle}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="text-muted-foreground truncate text-xs">@{user.handle}</p>
      </Link>
      {showFollow && !user.isSelf && (
        <FollowButton
          userId={user.id}
          handle={user.handle}
          initialFollowing={user.isFollowing}
        />
      )}
    </div>
  );
}
