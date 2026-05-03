"use client";

import { useQuery } from "@tanstack/react-query";

import { budgetService } from "@/features/budgets/services/budget.service";
import { qk } from "@/lib/query-keys";

export function useBudgetsQuery(householdId: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.budgets(householdId),
    queryFn: () =>
      householdId ? budgetService.listMonthlyBudgets(householdId) : [],
    enabled: Boolean(enabled && householdId),
    staleTime: 15_000,
  });
}
