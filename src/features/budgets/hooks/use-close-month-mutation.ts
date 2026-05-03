"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { budgetService } from "@/features/budgets/services/budget.service";
import { qk } from "@/lib/query-keys";

export function useCloseMonthMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (budgetId: string) =>
      budgetService.closeMonth(budgetId),
    onSuccess: (_, budgetId) => {
      void qc.invalidateQueries({ queryKey: qk.budget(budgetId) });
      void qc.invalidateQueries({ queryKey: qk.budgets(householdId) });
    },
  });
}
