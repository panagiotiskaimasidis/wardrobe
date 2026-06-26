"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { followUser, unfollowUser } from "@/lib/actions/social";
import { Button } from "@/components/ui/button";

export function FollowButton({
  userId,
  handle,
  initialFollowing,
  size = "sm",
}: {
  userId: string;
  handle: string;
  initialFollowing: boolean;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [hovering, setHovering] = useState(false);

  async function toggle() {
    setPending(true);
    const next = !following;
    setFollowing(next); // optimistic
    const res = next ? await followUser(userId) : await unfollowUser(userId);
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      setFollowing(!next);
      toast.error(res.error);
    }
  }

  return (
    <Button
      size={size}
      variant={following ? "outline" : "default"}
      onClick={toggle}
      disabled={pending}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-label={following ? `Unfollow @${handle}` : `Follow @${handle}`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <UserCheck className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {following ? (hovering ? "Unfollow" : "Following") : "Follow"}
    </Button>
  );
}
