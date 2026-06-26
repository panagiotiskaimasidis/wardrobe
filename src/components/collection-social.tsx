"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { addComment, deleteComment, toggleLike } from "@/lib/actions/social";
import type { CollectionSocial as SocialData } from "@/lib/queries/social";
import type { CommentView } from "@/lib/queries/social";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CollectionSocial({
  collectionId,
  initial,
  canInteract,
}: {
  collectionId: string;
  initial: SocialData;
  canInteract: boolean;
}) {
  const [liked, setLiked] = useState(initial.likedByViewer);
  const [likeCount, setLikeCount] = useState(initial.likeCount);
  const [comments, setComments] = useState<CommentView[]>(initial.comments);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLike() {
    if (!canInteract) {
      toast.info("Sign in to like closets.");
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    const res = await toggleLike({
      targetType: "collection",
      targetId: collectionId,
    });
    if (!res.ok) {
      setLiked(!nextLiked);
      setLikeCount((c) => c + (nextLiked ? -1 : 1));
      toast.error(res.error);
    } else {
      setLikeCount(res.data.count);
      setLiked(res.data.liked);
    }
  }

  async function onComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const res = await addComment({
      targetType: "collection",
      targetId: collectionId,
      body,
    });
    setBusy(false);
    if (res.ok) {
      setComments((c) => [...c, res.data]);
      setBody("");
    } else {
      toast.error(res.error);
    }
  }

  async function onDelete(id: string) {
    const snapshot = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    const res = await deleteComment(id);
    if (!res.ok) {
      setComments(snapshot);
      toast.error(res.error);
    }
  }

  return (
    <section className="mt-10 border-t pt-6">
      <div className="flex items-center gap-4">
        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          onClick={onLike}
          aria-pressed={liked}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </Button>
        <span className="text-muted-foreground text-sm">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {comments.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No comments yet.{canInteract ? " Be the first!" : ""}
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3">
            <Link href={`/u/${c.author.handle}`}>
              <Avatar className="h-8 w-8">
                {c.author.avatarUrl && (
                  <AvatarImage src={c.author.avatarUrl} alt={c.author.name} />
                )}
                <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <p className="text-sm">
                <Link
                  href={`/u/${c.author.handle}`}
                  className="font-medium hover:underline"
                >
                  {c.author.name}
                </Link>{" "}
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(c.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </p>
              <p className="text-sm">{c.body}</p>
            </div>
            {c.isOwn && (
              <button
                onClick={() => onDelete(c.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete comment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canInteract && (
        <form onSubmit={onComment} className="mt-4 flex gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            aria-label="Add a comment"
          />
          <Button type="submit" disabled={busy || !body.trim()}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}
    </section>
  );
}
