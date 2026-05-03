"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { transactionAttachmentService } from "@/features/transactions/services/transaction-attachment.service";
import { qk } from "@/lib/query-keys";

export function useUploadTransactionAttachmentMutation(
  householdId: string | null
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (opts: {
      transactionId: string;
      householdId: string;
      file: File;
      actorUserId: string;
    }) => transactionAttachmentService.upload(opts),
    onSuccess: (_, v) => {
      void qc.invalidateQueries({
        queryKey: qk.transactionAttachments(v.transactionId),
      });
      void qc.invalidateQueries({ queryKey: qk.transaction(v.transactionId) });
      void qc.invalidateQueries({ queryKey: ["transactions", householdId] });
    },
  });
}
