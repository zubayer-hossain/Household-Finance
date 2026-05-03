"use client";

import { useQuery } from "@tanstack/react-query";

import { draftBudgetService } from "@/features/categories/services/draft-budget.service";

export function useDraftBudgetTransactionCountQuery(
  monthlyBudgetId: string | null,
  householdId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["draft-budget-tx-count", monthlyBudgetId, householdId],
    queryFn: () =>
      draftBudgetService.countLiveTransactions(monthlyBudgetId!, householdId!),
    enabled: Boolean(enabled && monthlyBudgetId && householdId),
    staleTime: 10_000,
  });
}
