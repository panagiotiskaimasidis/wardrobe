import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus, Layers } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { getUserCollections } from "@/lib/queries/collections";
import { Button } from "@/components/ui/button";
import { CollectionCard } from "@/components/collection-card";
import { CollectionFormDialog } from "@/components/collection-form-dialog";

export const metadata: Metadata = { title: "My closets" };

export default async function CollectionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/collections");

  const collections = await getUserCollections(user.id, user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My closets</h1>
          <p className="text-muted-foreground mt-1">
            {collections.length} closet{collections.length === 1 ? "" : "s"}
          </p>
        </div>
        <CollectionFormDialog mode="create">
          <Button>
            <Plus className="h-4 w-4" /> New closet
          </Button>
        </CollectionFormDialog>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <Layers className="text-muted-foreground h-10 w-10" />
          <p className="font-medium">No closets yet</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Create your first closet, then drag items from the catalog to start
            curating.
          </p>
          <CollectionFormDialog mode="create">
            <Button>
              <Plus className="h-4 w-4" /> Create a closet
            </Button>
          </CollectionFormDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      )}
    </div>
  );
}
