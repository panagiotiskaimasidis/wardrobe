"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCollection } from "@/lib/actions/collections";
import type { Visibility } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CollectionFormDialog } from "@/components/collection-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CollectionHeaderActions({
  collection,
}: {
  collection: {
    id: string;
    title: string;
    description: string | null;
    visibility: Visibility;
  };
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await deleteCollection(collection.id);
    setDeleting(false);
    if (res.ok) {
      toast.success("Closet deleted");
      router.push("/collections");
    } else {
      toast.error(res.error);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <CollectionFormDialog mode="edit" collection={collection}>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </CollectionFormDialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          aria-label="Delete closet"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{collection.title}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the closet and its arrangement. The items
              themselves stay in the catalog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting
                </>
              ) : (
                "Delete closet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
