"use client";

import Link from "next/link";
import { Suspense, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { InviteMemberForm } from "@/features/household/components/InviteMemberForm";
import { MembersTable } from "@/features/household/components/MembersTable";
import { PermissionGate } from "@/features/household/components/PermissionGate";
import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";
import { useMembersQuery } from "@/features/household/hooks/use-members-query";
import { useAppShellStore } from "@/stores/use-app-shell-store";

function MembersRouteBody() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("householdId");

  const activeId = useAppShellStore((s) => s.activeHouseholdId);
  const setActiveMembership = useAppShellStore((s) => s.setActiveMembership);

  const { data: memberships, isLoading: membershipsLoading } =
    useHouseholdMembershipsQuery(true);

  const requestedInvalid =
    Boolean(requestedId) &&
    Boolean(memberships?.length) &&
    !memberships!.some((m) => m.householdId === requestedId);

  const requestedValid =
    Boolean(requestedId) &&
    Boolean(memberships?.some((m) => m.householdId === requestedId!));

  const targetHouseholdId = requestedInvalid
    ? null
    : requestedValid && requestedId
      ? requestedId
      : activeId;

  useLayoutEffect(() => {
    if (!requestedValid || !requestedId || !memberships?.length) return;
    const m = memberships.find((x) => x.householdId === requestedId);
    if (!m || activeId === requestedId) return;
    setActiveMembership(requestedId, m.role);
  }, [
    requestedValid,
    requestedId,
    memberships,
    activeId,
    setActiveMembership,
  ]);

  const { data: members, isLoading: membersLoading } = useMembersQuery(
    targetHouseholdId ?? null
  );

  const activeMembership =
    memberships?.find((m) => m.householdId === targetHouseholdId) ?? null;

  if (membershipsLoading) {
    return (
      <Skeleton className="h-14 w-full max-w-md rounded-2xl shadow-soft" />
    );
  }

  if (requestedInvalid) {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="eyebrow">People</p>
            <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
              Members
            </h1>
          </div>
          <Link
            href="/app/household"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border/90 bg-card px-4 text-sm font-semibold text-muted-foreground shadow-soft transition-[transform,box-shadow] active:scale-[0.99] hover:text-foreground hover:shadow-card"
          >
            Household management
          </Link>
        </header>
        <p className="max-w-xl rounded-2xl border border-destructive/30 bg-destructive/[0.06] px-5 py-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          This household wasn&apos;t found in your workspaces. Open{" "}
          <Link
            href="/app/household"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            household management
          </Link>{" "}
          and pick one.
        </p>
      </div>
    );
  }

  if (!targetHouseholdId) {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="eyebrow">People</p>
            <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
              Members
            </h1>
          </div>
          <Link
            href="/app/household"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border/90 bg-card px-4 text-sm font-semibold text-muted-foreground shadow-soft transition-[transform,box-shadow] active:scale-[0.99] hover:text-foreground hover:shadow-card"
          >
            Household management
          </Link>
        </header>
        <div className="max-w-xl rounded-2xl border border-border/80 bg-muted/40 px-5 py-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
          Choose a household first. Open{" "}
          <Link
            href="/app/household"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            household management
          </Link>{" "}
          and select <span className="font-medium text-foreground">Open as workspace</span>{" "}
          on a card, or use the link from there to manage members.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow">People</p>
          <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
            Members
          </h1>
          {activeMembership ? (
            <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
              Household:{" "}
              <span className="font-semibold tracking-tight text-foreground">
                {activeMembership.household.name}
              </span>{" "}
              <span className="capitalize">({activeMembership.role})</span>
            </p>
          ) : null}
        </div>
        <Link
          href="/app/household"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border/90 bg-card px-4 text-sm font-semibold text-muted-foreground shadow-soft transition-[transform,box-shadow] active:scale-[0.99] hover:text-foreground hover:shadow-card"
        >
          Household management
        </Link>
      </header>

      {membersLoading ? (
        <Skeleton className="h-56 w-full rounded-3xl shadow-soft" />
      ) : members ? (
        <MembersTable members={members} />
      ) : null}

      <PermissionGate
        need="canInviteMember"
        fallback={
          <div className="rounded-2xl border border-border/80 bg-muted/45 px-4 py-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Only owners and admins can invite members.
          </div>
        }
      >
        <InviteMemberForm householdId={targetHouseholdId} />
      </PermissionGate>

      <Link
        href="/app"
        className="text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        ← Home
      </Link>
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense
      fallback={
        <Skeleton className="h-32 w-full max-w-lg rounded-3xl shadow-soft" />
      }
    >
      <MembersRouteBody />
    </Suspense>
  );
}
