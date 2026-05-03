"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { budgetService } from "@/features/budgets/services/budget.service";
import type { RenameBudgetCategorySchema } from "@/features/budgets/schemas/budget.schemas";
import { qk } from "@/lib/query-keys";

export function useRenameCategoryMutation(opts: {
  householdId: string | null;
  monthlyBudgetId: string;
  onSuccess?: () => void;
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: RenameBudgetCategorySchema) =>
      budgetService.updateBudgetCategoryName(input),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: qk.budgetCategories(opts.monthlyBudgetId),
      });
      void qc.invalidateQueries({ queryKey: qk.budget(opts.monthlyBudgetId) });
      void qc.invalidateQueries({ queryKey: qk.budgets(opts.householdId) });
      opts.onSuccess?.();
    },
  });
}
