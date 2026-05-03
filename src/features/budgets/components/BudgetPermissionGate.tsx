"use client";

import type { ReactNode } from "react";

import { PermissionGate } from "@/features/household/components/PermissionGate";
import type { HouseholdCapabilities } from "@/features/household/types";

type BudgetCap = keyof Pick<
  HouseholdCapabilities,
  | "canViewBudgets"
  | "canCreateBudget"
  | "canEditBudget"
  | "canApproveBudget"
  | "canCloseMonth"
>;

export function BudgetPermissionGate({
  need,
  fallback = null,
  children,
}: {
  need: BudgetCap | BudgetCap[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PermissionGate need={need} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}
