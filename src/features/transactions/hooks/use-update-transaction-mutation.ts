"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UpdateTransactionSchema } from "@/features/transactions/schemas/transaction.schemas";
import { transactionService } from "@/features/transactions/services/transaction.service";
import { qk } from "@/lib/query-keys";

export function useUpdateTransactionMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTransactionSchema) =>
      transactionService.updateTransaction(input),
    onSuccess: (row) => {
      const hid = householdId ?? row.household_id;
      void qc.invalidateQueries({ queryKey: ["transactions", hid] });
      void qc.invalidateQueries({ queryKey: qk.transaction(row.id) });
      void qc.invalidateQueries({
        queryKey: qk.budgetCategories(row.monthly_budget_id),
      });
      void qc.invalidateQueries({ queryKey: qk.budget(row.monthly_budget_id) });
      void qc.invalidateQueries({ queryKey: qk.budgets(hid) });
    },
  });
}
