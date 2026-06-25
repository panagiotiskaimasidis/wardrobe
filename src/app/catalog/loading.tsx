import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/skeletons";

export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-2 h-9 w-40" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="mb-6 flex flex-wrap gap-2">
        <Skeleton className="h-9 min-w-[200px] flex-1" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[130px]" />
      </div>
      <ProductGridSkeleton count={12} />
    </div>
  );
}
