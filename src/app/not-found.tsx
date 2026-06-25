import Link from "next/link";
import { Shirt } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <Shirt className="text-primary h-12 w-12" />
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        This page may be private, moved, or never existed. Let’s get you back to
        curating.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalog">Browse catalog</Link>
        </Button>
      </div>
    </div>
  );
}
