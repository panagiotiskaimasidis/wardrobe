import { Skeleton } from "@/components/ui/skeleton";
import { CollectionGridSkeleton } from "@/components/skeletons";

export default function CollectionsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-2 h-9 w-48" />
      <Skeleton className="mb-6 h-4 w-24" />
      <CollectionGridSkeleton />
    </div>
  );
}
