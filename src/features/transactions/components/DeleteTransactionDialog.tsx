"use client";

import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this expense?"
      description="This removes the expense from your active log. You can type the phrase below to confirm soft-delete."
      confirmationPhrase="delete expense"
      phraseInputId="delete-expense-phrase"
      confirmLabel="Delete expense"
      pending={pending}
      onConfirm={onConfirm}
    />
  );
}
