"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { budgetReallocationService } from "@/features/budgets/services/budget-reallocation.service";
import type { BudgetReallocationSchema } from "@/features/budgets/schemas/budget.schemas";
import { qk } from "@/lib/query-keys";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function useReallocateBudgetMutation(householdId: string | null) {
  const qc = useQueryClient();
  const userId = useAppShellStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: BudgetReallocationSchema) => {
      if (!userId) throw new Error("You must be signed in.");
      return budgetReallocationService.reallocate(payload, userId);
    },
    onSuccess: (_, payload) => {
      void qc.invalidateQueries({
        queryKey: qk.budgetCategories(payload.monthlyBudgetId),
      });
      void qc.invalidateQueries({ queryKey: qk.budget(payload.monthlyBudgetId) });
      void qc.invalidateQueries({ queryKey: qk.budgets(householdId) });
    },
  });
}
