"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error("[app/app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-start gap-6 rounded-[1.375rem] border border-destructive/25 bg-destructive/[0.06] p-8">
      <div className="space-y-2">
        <p className="eyebrow text-destructive/90">Household dashboard error</p>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          This dashboard section failed to render
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          Try again below. Repeated failures usually mean memberships are still syncing or tables are
          behind the latest migrations.
        </p>
      </div>
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => reset()}>
        Retry dashboard
      </Button>
    </div>
  );
}
