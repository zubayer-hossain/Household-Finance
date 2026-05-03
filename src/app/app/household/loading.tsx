import { Skeleton } from "@/components/ui/skeleton";

export default function HouseholdRouteLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-24 w-full max-w-xl rounded-3xl shadow-soft" />
      <Skeleton className="h-64 w-full rounded-3xl shadow-soft" />
    </div>
  );
}
