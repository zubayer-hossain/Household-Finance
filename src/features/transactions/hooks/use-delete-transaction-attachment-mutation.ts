"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { transactionAttachmentService } from "@/features/transactions/services/transaction-attachment.service";
import { qk } from "@/lib/query-keys";

export function useDeleteTransactionAttachmentMutation(
  householdId: string | null
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: transactionAttachmentService.remove,
    onSuccess: (_, v) => {
      void qc.invalidateQueries({
        queryKey: qk.transactionAttachments(v.transactionId),
      });
      void qc.invalidateQueries({ queryKey: qk.transaction(v.transactionId) });
      void qc.invalidateQueries({ queryKey: ["transactions", householdId] });
    },
  });
}
