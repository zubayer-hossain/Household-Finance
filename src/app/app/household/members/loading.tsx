import { Skeleton } from "@/components/ui/skeleton";

export default function MembersRouteLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-16 w-full max-w-md rounded-2xl shadow-soft" />
      <Skeleton className="h-56 w-full max-w-3xl rounded-[1.375rem] shadow-soft" />
    </div>
  );
}
