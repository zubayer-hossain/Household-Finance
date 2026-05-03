"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="surface-market flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="max-w-md space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Something broke
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          We couldn&apos;t render this route
        </h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          Retry after a refresh. If the problem persists, check Supabase connectivity and env keys.
        </p>
      </div>
      <Button type="button" className="rounded-xl" size="lg" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
