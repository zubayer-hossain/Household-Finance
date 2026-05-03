"use client";

import { useQuery } from "@tanstack/react-query";

import { budgetService } from "@/features/budgets/services/budget.service";
import { qk } from "@/lib/query-keys";

export function useBudgetCategoriesQuery(
  budgetId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: qk.budgetCategories(budgetId ?? "pending"),
    queryFn: () => budgetService.listCategories(budgetId!),
    enabled: Boolean(enabled && budgetId && budgetId !== "pending"),
    staleTime: 15_000,
  });
}
