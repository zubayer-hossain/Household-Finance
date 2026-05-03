"use client";

import { useQuery } from "@tanstack/react-query";

import { transactionService } from "@/features/transactions/services/transaction.service";
import { qk } from "@/lib/query-keys";

export function useTransactionsQuery(
  householdId: string | null,
  monthlyBudgetId: string | null,
  budgetCategoryId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: qk.transactions(householdId, monthlyBudgetId, budgetCategoryId),
    queryFn: () =>
      householdId && monthlyBudgetId
        ? transactionService.listTransactions({
            householdId,
            monthlyBudgetId,
            budgetCategoryId,
          })
        : [],
    enabled: Boolean(enabled && householdId && monthlyBudgetId),
    staleTime: 45_000,
  });
}
