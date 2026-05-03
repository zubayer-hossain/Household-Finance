"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { budgetAdjustmentService } from "@/features/budgets/services/budget-adjustment.service";
import { budgetService } from "@/features/budgets/services/budget.service";
import type {
  BudgetAdjustmentSchema,
  EditCategoryBudgetSchema,
} from "@/features/budgets/schemas/budget.schemas";
import { qk } from "@/lib/query-keys";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export type AdjustBudgetVariables =
  | { kind: "elevated"; payload: BudgetAdjustmentSchema }
  | {
      kind: "direct";
      payload: Pick<
        EditCategoryBudgetSchema,
        "monthlyBudgetId" | "categoryId" | "adjustedAmount"
      >;
    };

export function useAdjustBudgetMutation(householdId: string | null) {
  const qc = useQueryClient();
  const userId = useAppShellStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (vars: AdjustBudgetVariables) => {
      if (vars.kind === "elevated") {
        if (!userId) throw new Error("You must be signed in.");
        return budgetAdjustmentService.createAdjustment(vars.payload, userId);
      }
      return budgetService.updateCategoryAdjustedDirect({
        monthlyBudgetId: vars.payload.monthlyBudgetId,
        categoryId: vars.payload.categoryId,
        adjustedAmount: vars.payload.adjustedAmount,
      });
    },
    onSuccess: (_data, vars) => {
      const bid =
        vars.kind === "elevated"
          ? vars.payload.monthlyBudgetId
          : vars.payload.monthlyBudgetId;
      void qc.invalidateQueries({ queryKey: qk.budgetCategories(bid) });
      void qc.invalidateQueries({ queryKey: qk.budget(bid) });
      void qc.invalidateQueries({ queryKey: qk.budgets(householdId) });
    },
  });
}
