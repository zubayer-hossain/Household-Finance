"use client";

import type { ReactNode } from "react";

import { useHouseholdCapabilities } from "@/features/household/hooks/use-household-capabilities";

type HouseholdCaps = NonNullable<ReturnType<typeof useHouseholdCapabilities>>;
type CapabilityKey = keyof HouseholdCaps;

export function PermissionGate({
  need,
  fallback = null,
  children,
}: {
  need: CapabilityKey | CapabilityKey[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const caps = useHouseholdCapabilities();
  const keys = Array.isArray(need) ? need : [need];
  const ok = Boolean(caps && keys.every((k) => caps[k]));

  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}
