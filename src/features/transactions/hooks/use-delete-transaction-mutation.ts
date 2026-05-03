"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { transactionService } from "@/features/transactions/services/transaction.service";
import { qk } from "@/lib/query-keys";

export function useDeleteTransactionMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      transactionId: string;
      householdId: string;
      monthlyBudgetId: string;
    }) =>
      transactionService.softDeleteTransaction(
        vars.transactionId,
        vars.householdId
      ),
    onSuccess: (_, v) => {
      const hid = householdId ?? v.householdId;
      void qc.invalidateQueries({ queryKey: ["transactions", hid] });
      void qc.invalidateQueries({ queryKey: qk.transaction(v.transactionId) });
      void qc.invalidateQueries({
        queryKey: qk.budgetCategories(v.monthlyBudgetId),
      });
      void qc.invalidateQueries({ queryKey: qk.budget(v.monthlyBudgetId) });
      void qc.invalidateQueries({ queryKey: qk.budgets(hid) });
    },
  });
}
