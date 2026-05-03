"use client";

import { useQuery } from "@tanstack/react-query";

import { categoryService } from "@/features/categories/services/category.service";
import { qk } from "@/lib/query-keys";

export function useHouseholdCategoriesQuery(
  householdId: string | null,
  opts?: { includeArchived?: boolean; enabled?: boolean }
) {
  const includeArchived = opts?.includeArchived ?? false;
  return useQuery({
    queryKey: qk.householdCategories(householdId, includeArchived),
    queryFn: () =>
      householdId
        ? categoryService.listForHousehold(householdId, { includeArchived })
        : [],
    enabled: Boolean(householdId && (opts?.enabled ?? true)),
    staleTime: 30_000,
  });
}
