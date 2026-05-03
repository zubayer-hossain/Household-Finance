"use client";

import type { ReactNode } from "react";

import { PermissionGate } from "@/features/household/components/PermissionGate";
import type { HouseholdCapabilities } from "@/features/household/types";

type CategoryCap = keyof Pick<
  HouseholdCapabilities,
  "canViewCategories" | "canManageCategories" | "canDeleteDraftBudget"
>;

export function CategoryPermissionGate({
  need,
  fallback = null,
  children,
}: {
  need: CategoryCap | CategoryCap[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PermissionGate need={need} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}
