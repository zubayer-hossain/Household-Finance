"use client";

import { useAppShellStore } from "@/stores/use-app-shell-store";

/** Capability-based accessor for UI guards. */
export function useHouseholdCapabilities() {
  return useAppShellStore((s) => s.resolvedCapabilities);
}
