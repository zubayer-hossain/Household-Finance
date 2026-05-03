"use client";

import { useQuery } from "@tanstack/react-query";

import { transactionAttachmentService } from "@/features/transactions/services/transaction-attachment.service";
import { qk } from "@/lib/query-keys";

export function useTransactionAttachmentsQuery(
  transactionId: string | null,
  householdId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: qk.transactionAttachments(transactionId ?? "—"),
    queryFn: () =>
      transactionId && householdId
        ? transactionAttachmentService.listForTransaction(
            transactionId,
            householdId
          )
        : [],
    enabled: Boolean(enabled && transactionId && householdId),
    staleTime: 30_000,
  });
}
