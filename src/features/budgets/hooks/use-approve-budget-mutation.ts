"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { budgetService } from "@/features/budgets/services/budget.service";
import { qk } from "@/lib/query-keys";

export function useApproveBudgetMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      budgetId: string;
      actorUserId: string;
    }) =>
      budgetService.approveBudget(payload.budgetId, payload.actorUserId),
    onSuccess: (_, payload) => {
      void qc.invalidateQueries({ queryKey: qk.budget(payload.budgetId) });
      void qc.invalidateQueries({ queryKey: qk.budgets(householdId) });
    },
  });
}
