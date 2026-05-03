import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 py-16">
      <Skeleton className="h-12 w-40 rounded-2xl opacity-80" />
      <Skeleton className="h-52 w-full max-w-md rounded-3xl shadow-soft" />
      <p className="text-sm font-medium text-muted-foreground">Loading…</p>
    </div>
  );
}
