import { Skeleton } from "@/components/ui/skeleton";

/** Matches HouseholdBootstrap pacing so route transitions feel cohesive. */
export default function AppShellLoading() {
  return (
    <div className="surface-market flex min-h-dvh flex-col">
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-28 w-full rounded-3xl shadow-soft" />
          <Skeleton className="mx-auto h-4 w-2/3 rounded-full opacity-70" />
          <Skeleton className="h-44 w-full rounded-3xl opacity-95" />
          <p className="text-center text-sm font-medium text-muted-foreground">
            Opening your household area…
          </p>
        </div>
      </div>
    </div>
  );
}
