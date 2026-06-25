"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, send this to your error tracker.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <AlertTriangle className="text-destructive h-12 w-12" />
      <h1 className="text-2xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. You can try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
