import Link from "next/link";

import { ChevronRight, LayoutGrid, Users } from "lucide-react";

import { DashboardHouseholdContext } from "@/features/household/components/DashboardHouseholdContext";
import { cn } from "@/lib/utils";

const tileCls =
  "group flex min-h-[4.25rem] items-center gap-4 rounded-2xl border border-border/90 bg-card px-4 py-4 text-left shadow-soft transition-[transform,box-shadow,border-color] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-h-[4.5rem]";

export default function AppHomePage() {
  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <p className="eyebrow">Overview</p>
        <DashboardHouseholdContext />
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
          Dashboard
        </h1>
        <p className="max-w-[28rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
          This dashboard will surface household spending and budget health once Budget ships. Until
          then, jump into households and members from the shortcuts below — every change stays scoped to
          the household you actively opened.
        </p>
      </header>
      <nav className="flex flex-col gap-3" aria-label="Household shortcuts">
        <Link href="/app/household" className={cn(tileCls, "hover:border-primary/25 hover:shadow-card")}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutGrid className="size-[1.375rem]" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold tracking-tight text-foreground">
              Households
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              List households, invite people, rename, or switch your active household
            </span>
          </span>
          <ChevronRight
            className="size-[1.125rem] shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </Link>
        <Link href="/app/household/members" className={cn(tileCls, "hover:border-primary/25 hover:shadow-card")}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-[1.375rem]" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold tracking-tight text-foreground">
              Members
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Roles & invites
            </span>
          </span>
          <ChevronRight
            className="size-[1.125rem] shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </Link>
      </nav>
    </div>
  );
}
