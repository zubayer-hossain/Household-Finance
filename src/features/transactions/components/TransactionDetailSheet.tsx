"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TransactionAttachmentList } from "@/features/transactions/components/TransactionAttachmentList";
import { TransactionAttachmentUploader } from "@/features/transactions/components/TransactionAttachmentUploader";
import { useDeleteTransactionAttachmentMutation } from "@/features/transactions/hooks/use-delete-transaction-attachment-mutation";
import { useTransactionAttachmentsQuery } from "@/features/transactions/hooks/use-transaction-attachments-query";
import { useUploadTransactionAttachmentMutation } from "@/features/transactions/hooks/use-upload-transaction-attachment-mutation";
import {
  canDeleteTransactionRow,
  canEditTransactionRow,
} from "@/features/transactions/lib/transaction-permissions";
import type { HouseholdCapabilities } from "@/features/household/types";
import { transactionService } from "@/features/transactions/services/transaction.service";
import type { TransactionAttachmentRow } from "@/features/transactions/types";
import { formatCurrencyMajor } from "@/lib/format/currency";
import { qk } from "@/lib/query-keys";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function TransactionDetailSheet({
  open,
  onOpenChange,
  transactionId,
  householdId,
  currency,
  locale,
  caps,
  readOnlyMonth,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
  householdId: string | null;
  currency: string;
  locale: string | undefined;
  caps: HouseholdCapabilities | null;
  readOnlyMonth: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const user = useAppShellStore((s) => s.user);

  const detailQuery = useQuery({
    queryKey: transactionId
      ? qk.transaction(transactionId)
      : ["transaction", "none"],
    queryFn: () =>
      transactionId && householdId
        ? transactionService.getTransaction(transactionId, householdId)
        : null,
    enabled: Boolean(open && transactionId && householdId),
    staleTime: 30_000,
  });

  const tx = detailQuery.data ?? null;

  const attachmentsQuery = useTransactionAttachmentsQuery(
    transactionId,
    householdId,
    Boolean(open && transactionId && householdId)
  );

  const uploadMut = useUploadTransactionAttachmentMutation(householdId);
  const deleteAttachMut = useDeleteTransactionAttachmentMutation(householdId);

  const canEdit = Boolean(
    tx &&
      user?.id &&
      !readOnlyMonth &&
      canEditTransactionRow(tx, user.id, caps)
  );

  const canDelete = Boolean(
    tx &&
      user?.id &&
      !readOnlyMonth &&
      canDeleteTransactionRow(tx, user.id, caps)
  );

  const canAttach =
    Boolean(
      caps?.canCreateTransaction &&
        tx &&
        user?.id &&
        !readOnlyMonth
    );

  function canRemoveAttachment(row: TransactionAttachmentRow): boolean {
    if (!caps || !user?.id) return false;
    if (caps.canDeleteAnyTransaction) return true;
    return row.uploaded_by === user.id;
  }

  async function handleRemoveAttachment(row: TransactionAttachmentRow) {
    if (!transactionId || !householdId) return;
    await deleteAttachMut.mutateAsync({
      attachmentId: row.id,
      transactionId,
      householdId,
      storagePath: row.file_url,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,calc(100dvh-1rem))] w-full max-w-[min(calc(100vw-1.25rem),42rem)] flex-col gap-5 overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Expense detail</DialogTitle>
          <DialogDescription>
            Amount, category, and receipts for this log entry.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}

        {detailQuery.isError ? (
          <p className="text-sm font-medium text-destructive">
            Could not load this expense.
          </p>
        ) : null}

        {tx ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {formatCurrencyMajor(tx.amount, currency, locale)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </p>
              <p className="text-[0.9375rem] font-semibold">{tx.category_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </p>
              <p className="text-[0.9375rem] font-medium">{tx.transaction_date}</p>
            </div>
            {tx.note ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Note
                </p>
                <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">
                  {tx.note}
                </p>
              </div>
            ) : null}

            <Separator />

            <div className="rounded-2xl border border-border/75 bg-muted/25 p-4 md:p-5">
              <p className="mb-3 text-[13px] font-semibold tracking-tight text-foreground">
                Receipts
              </p>
              {attachmentsQuery.data && attachmentsQuery.data.length > 0 ? (
                <TransactionAttachmentList
                  attachments={attachmentsQuery.data}
                  onRemove={(row) => void handleRemoveAttachment(row)}
                  canRemove={(row) => canRemoveAttachment(row)}
                  singleColumn
                />
              ) : (
                <p className="text-sm text-muted-foreground">No attachments yet.</p>
              )}
              {canAttach ? (
                <TransactionAttachmentUploader
                  id="detail-tx-upload"
                  className="mt-4"
                  pending={uploadMut.isPending}
                  disabled={uploadMut.isPending}
                  onFile={(file) => {
                    if (!transactionId || !householdId || !user?.id) return;
                    void uploadMut.mutateAsync({
                      transactionId,
                      householdId,
                      file,
                      actorUserId: user.id,
                    });
                  }}
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[2.75rem] flex-1 rounded-xl"
                  onClick={() => {
                    onEdit(tx.id);
                    onOpenChange(false);
                  }}
                >
                  <Pencil className="mr-2 size-4" aria-hidden />
                  Edit
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-[2.75rem] flex-1 rounded-xl"
                  onClick={() => {
                    onDelete(tx.id);
                    onOpenChange(false);
                  }}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
