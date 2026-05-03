"use client";

import Link from "next/link";
import { Suspense, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormCallout } from "@/components/ui/form-callout";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteMemberDialog } from "@/features/household/components/InviteMemberForm";
import { MembersTable } from "@/features/household/components/MembersTable";
import { PermissionGate } from "@/features/household/components/PermissionGate";
import { useHouseholdCapabilities } from "@/features/household/hooks/use-household-capabilities";
import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";
import { useMembersQuery } from "@/features/household/hooks/use-members-query";
import { useAppShellStore } from "@/stores/use-app-shell-store";
import { cn } from "@/lib/utils";

function MembersRouteBody() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("householdId");

  const activeId = useAppShellStore((s) => s.activeHouseholdId);
  const user = useAppShellStore((s) => s.user);
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

  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useMembersQuery(targetHouseholdId ?? null);

  const activeMembership =
    memberships?.find((m) => m.householdId === targetHouseholdId) ?? null;

  const headerCaps = useHouseholdCapabilities();

  if (membershipsLoading) {
    return (
      <Skeleton className="h-14 w-full max-w-md rounded-2xl shadow-soft" />
    );
  }

  if (requestedInvalid) {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="eyebrow">People</p>
            <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
              Members
            </h1>
          </div>
          <Button
            variant="outline"
            size="default"
            className="inline-flex h-[2.875rem] min-h-[2.875rem] max-h-[2.875rem] shrink-0 px-3 py-0 text-[0.8125rem] whitespace-nowrap shadow-soft sm:text-[0.9375rem] sm:px-5"
            asChild
          >
            <Link href="/app/household">Household management</Link>
          </Button>
        </header>
        <p className="max-w-xl rounded-2xl border border-destructive/30 bg-destructive/[0.06] px-5 py-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          This household isn&apos;t in your memberships. Go to{" "}
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
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="eyebrow">People</p>
            <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
              Members
            </h1>
          </div>
          <Button
            variant="outline"
            size="default"
            className="inline-flex h-[2.875rem] min-h-[2.875rem] max-h-[2.875rem] shrink-0 px-3 py-0 text-[0.8125rem] whitespace-nowrap shadow-soft sm:text-[0.9375rem] sm:px-5"
            asChild
          >
            <Link href="/app/household">Household management</Link>
          </Button>
        </header>
        <div className="max-w-xl rounded-2xl border border-border/80 bg-muted/40 px-5 py-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
          Choose a household first. Open{" "}
          <Link
            href="/app/household"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            household management
          </Link>{" "}
          and tap <span className="font-medium text-foreground">Open this household</span> on a card
          so it&apos;s active, then return to members from there.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
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
        <div
          className={cn(
            "flex min-w-0 shrink-0 items-stretch gap-2",
            headerCaps?.canInviteMember
              ? "w-full sm:w-auto sm:justify-end"
              : "w-full justify-end sm:w-auto"
          )}
        >
          <PermissionGate need="canInviteMember">
            <div className="min-w-0 flex-1 basis-0 sm:flex-initial sm:basis-auto">
              <InviteMemberDialog
                householdId={targetHouseholdId}
                triggerButtonClassName="w-full justify-center"
              />
            </div>
          </PermissionGate>
          <Button
            variant="outline"
            size="default"
            className={cn(
              "inline-flex h-[2.875rem] min-h-[2.875rem] max-h-[2.875rem] items-center justify-center px-3 py-0 text-[0.8125rem] whitespace-nowrap shadow-soft sm:text-[0.9375rem] sm:px-5",
              headerCaps?.canInviteMember
                ? "min-w-0 flex-1 basis-0 sm:flex-initial sm:basis-auto"
                : "shrink-0"
            )}
            asChild
          >
            <Link href="/app/household">Household management</Link>
          </Button>
        </div>
      </header>

      {membersError ? (
        <FormCallout tone="destructive">
          Could not load the member list ({membersError.message}).{" "}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={() => void refetchMembers()}
          >
            Retry
          </button>
        </FormCallout>
      ) : null}

      {membersLoading ? (
        <Skeleton className="h-56 w-full rounded-3xl shadow-soft" />
      ) : (
        <MembersTable
          householdId={targetHouseholdId}
          members={members ?? []}
          viewerUserId={user?.id ?? null}
          viewerRole={activeMembership?.role ?? null}
        />
      )}

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
