"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Loader2, Plus, Check } from "lucide-react";
import { toast } from "sonner";

import { addItemToCollection } from "@/lib/actions/collections";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollectionFormDialog } from "@/components/collection-form-dialog";

type Option = { id: string; title: string; itemCount: number };

export function SaveToClosetButton({
  productId,
  variant = "secondary",
  className,
  label = "Save",
}: {
  productId: string;
  variant?: "secondary" | "outline" | "default";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["my-collections"],
    enabled: open,
    queryFn: async () => {
      const res = await fetch("/api/my/collections");
      if (res.status === 401) throw new Error("unauthorized");
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as { collections: Option[] };
    },
  });

  async function save(collectionId: string) {
    setSavingId(collectionId);
    const res = await addItemToCollection({ collectionId, productId });
    setSavingId(null);
    if (res.ok) {
      setSavedIds((s) => new Set(s).add(collectionId));
      toast.success(
        res.data.alreadyPresent ? "Already in that closet" : "Saved to closet",
      );
    } else {
      toast.error(res.error);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          <Bookmark className="h-4 w-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Save to closet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 px-2 py-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {!isLoading &&
          data?.collections.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onSelect={(e) => {
                e.preventDefault();
                void save(c.id);
              }}
            >
              {savedIds.has(c.id) ? (
                <Check className="text-primary" />
              ) : savingId === c.id ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Bookmark />
              )}
              <span className="flex-1 truncate">{c.title}</span>
              <span className="text-muted-foreground text-xs">
                {c.itemCount}
              </span>
            </DropdownMenuItem>
          ))}
        {!isLoading && data && data.collections.length === 0 && (
          <p className="text-muted-foreground px-2 py-2 text-sm">
            You have no closets yet.
          </p>
        )}
        <DropdownMenuSeparator />
        <CollectionFormDialog mode="create">
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Plus /> New closet…
          </DropdownMenuItem>
        </CollectionFormDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
