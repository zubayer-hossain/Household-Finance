"use client";

import { useQuery } from "@tanstack/react-query";

import { qk } from "@/lib/query-keys";
import { householdService } from "@/features/household/services/household.service";

export function useHouseholdMembershipsQuery(enabled = true) {
  return useQuery({
    queryKey: qk.householdMemberships,
    queryFn: () => householdService.listMyMemberships(),
    enabled,
    staleTime: 30_000,
  });
}
