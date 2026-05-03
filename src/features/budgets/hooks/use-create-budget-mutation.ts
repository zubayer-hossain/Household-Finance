"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { budgetService } from "@/features/budgets/services/budget.service";
import type { CreateMonthlyBudgetSchema } from "@/features/budgets/schemas/budget.schemas";
import { qk } from "@/lib/query-keys";

export function useCreateBudgetMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMonthlyBudgetSchema) =>
      budgetService.createMonthlyBudget({
        householdId: input.householdId,
        year: input.year,
        month: input.month,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.budgets(householdId) });
    },
  });
}
