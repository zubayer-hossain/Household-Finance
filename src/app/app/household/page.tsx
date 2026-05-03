"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Building2, LayoutGrid } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateHouseholdDialog } from "@/features/household/components/CreateHouseholdDialog";
import { HouseholdCreatorForm } from "@/features/household/components/HouseholdCreatorForm";
import { HouseholdWorkspaceCard } from "@/features/household/components/HouseholdWorkspaceCard";
import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export default function HouseholdPage() {
  const activeHouseholdId = useAppShellStore((s) => s.activeHouseholdId);
  const setActiveMembership = useAppShellStore((s) => s.setActiveMembership);

  const { data: memberships, isLoading } = useHouseholdMembershipsQuery(true);

  const sorted = useMemo(() => {
    if (!memberships?.length) return [];
    return [...memberships].sort((a, b) => {
      const aAct = Number(a.householdId === activeHouseholdId);
      const bAct = Number(b.householdId === activeHouseholdId);
      if (bAct !== aAct) return bAct - aAct;
      return a.household.name.localeCompare(b.household.name, undefined, {
        sensitivity: "base",
      });
    });
  }, [memberships, activeHouseholdId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-24 w-full max-w-xl rounded-3xl shadow-soft" />
        <Skeleton className="h-64 w-full rounded-3xl shadow-soft" />
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <header className="space-y-1">
          <p className="eyebrow">Your households</p>
          <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
            Household management
          </h1>
          <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            Each household keeps its own currency, people, and (soon) budgets. Start by creating one.
          </p>
        </header>
        <Card className="mx-auto w-full max-w-xl border-border/85 shadow-soft">
          <CardContent className="p-8">
            <div className="mb-6 flex size-14 items-center justify-center rounded-[1rem] bg-primary/[0.1]">
              <Building2
                className="size-[1.75rem] text-primary"
                aria-hidden
                strokeWidth={1.85}
              />
            </div>
            <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">
              Create your first household
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
              You&apos;ll be the owner. You can invite others afterward.
            </p>
            <div className="mt-8">
              <HouseholdCreatorForm
                idleLabel="Create household & enter app"
                submittingLabel="Creating…"
                submitLabel="Create household & enter app"
                onSuccess={async (row) => {
                  setActiveMembership(row.id, "owner");
                  window.location.assign("/app");
                }}
              />
            </div>
          </CardContent>
        </Card>
        <Link
          href="/app"
          className="text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow flex items-center gap-2">
            <LayoutGrid className="size-[0.9rem]" aria-hidden />
            Your households
          </p>
          <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
            Household management
          </h1>
          <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            Every household you belong to appears here — open one to make it active in the app,
            rename the ones you administer, invite people, or delete (when safe).
          </p>
        </div>
        <CreateHouseholdDialog
          variant="default"
          triggerLabel="Create household"
        />
      </header>

      <ul className="flex list-none flex-col gap-7 p-0">
        {sorted.map((membership) => (
          <li key={membership.householdId}>
            <HouseholdWorkspaceCard membership={membership} />
          </li>
        ))}
      </ul>

      <Link
        href="/app"
        className="text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
