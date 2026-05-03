"use client";

import { useQuery } from "@tanstack/react-query";

import { qk } from "@/lib/query-keys";
import { householdService } from "@/features/household/services/household.service";

export function useHouseholdDeletionAssessment(householdId: string | null) {
  return useQuery({
    queryKey:
      householdId != null ? qk.householdDeletionAssessment(householdId) : ["skip"],
    queryFn: () => householdService.assessHouseholdDeletion(householdId!),
    enabled: householdId != null,
    staleTime: 30_000,
  });
}
