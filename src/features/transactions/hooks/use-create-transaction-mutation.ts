"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateTransactionSchema } from "@/features/transactions/schemas/transaction.schemas";
import { transactionService } from "@/features/transactions/services/transaction.service";
import { qk } from "@/lib/query-keys";

export function useCreateTransactionMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      actorUserId,
    }: {
      input: CreateTransactionSchema;
      actorUserId: string;
    }) => transactionService.createTransaction(input, actorUserId),
    onSuccess: (_, { input }) => {
      const hid = householdId ?? input.householdId;
      void qc.invalidateQueries({ queryKey: ["transactions", hid] });
      void qc.invalidateQueries({ queryKey: qk.budgetCategories(input.monthlyBudgetId) });
      void qc.invalidateQueries({ queryKey: qk.budget(input.monthlyBudgetId) });
      void qc.invalidateQueries({ queryKey: qk.budgets(hid) });
    },
  });
}
