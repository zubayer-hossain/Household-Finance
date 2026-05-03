"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteHouseholdSection } from "@/features/household/components/DeleteHouseholdSection";
import { RenameHouseholdSection } from "@/features/household/components/RenameHouseholdSection";
import type { HouseholdMembership } from "@/features/household/types";
import { cn } from "@/lib/utils";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function HouseholdWorkspaceCard({
  membership,
}: {
  membership: HouseholdMembership;
}) {
  const activeHouseholdId = useAppShellStore((s) => s.activeHouseholdId);
  const setActiveMembership = useAppShellStore((s) => s.setActiveMembership);

  const isOwner = membership.role === "owner";
  const isActive = membership.householdId === activeHouseholdId;
  const household = membership.household;

  const tileCls =
    "inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-border/90 bg-card px-4 text-[13px] font-semibold text-foreground shadow-soft transition-[transform,box-shadow] active:scale-[0.99] hover:shadow-card";

  return (
    <article
      className={cn(
        "flex flex-col gap-5 rounded-[1.375rem] border border-border/90 bg-card p-6 shadow-soft",
        isActive && "border-primary/40 ring-[3px] ring-primary/[0.12]"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.1]">
            <Building2 className="size-7 text-primary" aria-hidden strokeWidth={1.85} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[1.2rem] font-semibold tracking-[-0.02em] text-foreground">
                {household.name}
              </h2>
              {isActive ? (
                <Badge variant="primary">Active household</Badge>
              ) : null}
            </div>
            <p className="text-[13px] capitalize leading-snug text-muted-foreground">
              Role: <span className="font-medium text-foreground">{membership.role}</span>
            </p>
            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] text-muted-foreground">
              <div>
                <dt className="inline font-medium text-muted-foreground">Currency:</dt>{" "}
                <dd className="inline font-semibold tabular-nums text-foreground">
                  {household.base_currency}
                </dd>
              </div>
              <div className="min-w-0 max-w-[16rem]">
                <dt className="inline font-medium text-muted-foreground">Timezone:</dt>{" "}
                <dd className="inline font-semibold text-foreground">{household.timezone}</dd>
              </div>
              <div className="font-mono text-[12px] text-muted-foreground/90">
                <span className="font-medium">Slug:</span> {household.slug}
              </div>
            </dl>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <Button
            type="button"
            variant={isActive ? "outline" : "default"}
            className={cn(
              "w-full rounded-xl sm:w-[11.5rem]",
              !isActive && "shadow-soft"
            )}
            disabled={isActive}
            onClick={() =>
              setActiveMembership(membership.householdId, membership.role)
            }
          >
            {isActive ? "This household is active" : "Open this household"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/70 pt-5">
        <Link
          href={`/app/household/members?householdId=${membership.householdId}`}
          className={tileCls}
        >
          Manage members
        </Link>
        <Link href="/app" className={`${tileCls} text-muted-foreground hover:text-foreground`}>
          Dashboard
        </Link>
      </div>

      <RenameHouseholdSection
        membershipRole={membership.role}
        householdId={household.id}
        household={household}
      />

      <DeleteHouseholdSection
        presentation="compact"
        householdId={household.id}
        householdName={household.name}
        isOwner={isOwner}
      />
    </article>
  );
}
