"use client";

import { useQuery } from "@tanstack/react-query";

import { budgetService } from "@/features/budgets/services/budget.service";
import { qk } from "@/lib/query-keys";

export function useBudgetQuery(opts: {
  budgetId: string | null;
  householdId: string | null;
  enabled?: boolean;
}) {
  const { budgetId, householdId, enabled = true } = opts;

  return useQuery({
    queryKey: qk.budget(budgetId ?? "pending"),
    queryFn: async () =>
      budgetService.getMonthlyBudget(budgetId!, householdId!),
    enabled:
      Boolean(enabled && budgetId && householdId && budgetId !== "pending"),
    staleTime: 15_000,
  });
}
