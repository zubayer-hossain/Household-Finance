"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { draftBudgetService } from "@/features/categories/services/draft-budget.service";
import { qk } from "@/lib/query-keys";

export function useDeleteDraftBudgetMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (monthlyBudgetId: string) =>
      draftBudgetService.deleteDraftBudget({
        monthlyBudgetId,
        householdId: householdId!,
      }),
    onSuccess: (_data, monthlyBudgetId) => {
      void qc.invalidateQueries({ queryKey: qk.budgets(householdId) });
      void qc.invalidateQueries({ queryKey: qk.budget(monthlyBudgetId) });
      void qc.invalidateQueries({ queryKey: qk.budgetCategories(monthlyBudgetId) });
    },
  });
}
