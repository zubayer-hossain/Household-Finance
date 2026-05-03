"use client";

import { useQuery } from "@tanstack/react-query";

import { qk } from "@/lib/query-keys";
import { membershipService } from "@/features/household/services/membership.service";

export function useMembersQuery(householdId: string | null) {
  return useQuery({
    queryKey: householdId ? qk.members(householdId) : ["members", "none"],
    queryFn: () => membershipService.listMembers(householdId!),
    enabled: Boolean(householdId),
    staleTime: 15_000,
  });
}
