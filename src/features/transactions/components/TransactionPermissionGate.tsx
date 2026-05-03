"use client";

import type { ReactNode } from "react";

import { PermissionGate } from "@/features/household/components/PermissionGate";
import type { HouseholdCapabilities } from "@/features/household/types";

type TxCap = keyof Pick<
  HouseholdCapabilities,
  | "canViewTransactions"
  | "canCreateTransaction"
  | "canEditOwnTransaction"
  | "canEditAnyTransaction"
  | "canDeleteOwnTransaction"
  | "canDeleteAnyTransaction"
>;

export function TransactionPermissionGate({
  need,
  fallback = null,
  children,
}: {
  need: TxCap | TxCap[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PermissionGate need={need} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}
