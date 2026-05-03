"use client";

import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";
import { useAppShellStore } from "@/stores/use-app-shell-store";

/** Subtle in-content household context — not chrome. */
export function DashboardHouseholdContext() {
  const activeId = useAppShellStore((s) => s.activeHouseholdId);
  const { data: memberships } = useHouseholdMembershipsQuery(true);
  const name = memberships?.find((m) => m.householdId === activeId)?.household
    .name;

  if (!name) return null;

  return (
    <p className="text-[13px] leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground/80">{name}</span>
      {" · "}your workspace
    </p>
  );
}
