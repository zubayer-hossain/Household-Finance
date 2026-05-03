"use client";

import { useEffect } from "react";

import { useAppShellStore } from "@/stores/use-app-shell-store";

import type {
  HouseholdMembership,
  HouseholdRole,
} from "@/features/household/types";

export function useHouseholdContextSync(
  list: HouseholdMembership[] | undefined
) {
  const authHydrated = useAppShellStore((s) => s.authHydrated);
  const activeHouseholdId = useAppShellStore((s) => s.activeHouseholdId);
  const activeMembershipRole = useAppShellStore((s) => s.activeMembershipRole);
  const setActiveMembership = useAppShellStore((s) => s.setActiveMembership);

  useEffect(() => {
    if (!authHydrated) return;

    if (!list || list.length === 0) {
      setActiveMembership(null, null);
      return;
    }

    let nextId = activeHouseholdId;
    const valid = nextId ? list.some((m) => m.householdId === nextId) : false;
    if (!nextId || !valid) nextId = list[0]!.householdId;

    const match = list.find((m) => m.householdId === nextId);
    const nextRole = (match?.role ?? null) as HouseholdRole | null;

    if (nextId === activeHouseholdId && nextRole === activeMembershipRole)
      return;

    setActiveMembership(nextId, nextRole);
  }, [
    authHydrated,
    list,
    activeHouseholdId,
    activeMembershipRole,
    setActiveMembership,
  ]);
}
