import type { HouseholdCapabilities } from "@/features/household/types";
import type { TransactionRow } from "@/features/transactions/types";

export function canViewTransactions(
  caps: HouseholdCapabilities | null | undefined
): boolean {
  return Boolean(caps?.canViewTransactions);
}

export function canCreateTransaction(
  caps: HouseholdCapabilities | null | undefined
): boolean {
  return Boolean(caps?.canCreateTransaction);
}

export function canEditTransactionRow(
  tx: Pick<TransactionRow, "created_by">,
  viewerUserId: string | null | undefined,
  caps: HouseholdCapabilities | null | undefined
): boolean {
  if (!caps?.canEditOwnTransaction && !caps?.canEditAnyTransaction) return false;
  if (caps.canEditAnyTransaction) return true;
  return Boolean(
    caps.canEditOwnTransaction &&
      viewerUserId &&
      tx.created_by === viewerUserId
  );
}

export function canDeleteTransactionRow(
  tx: Pick<TransactionRow, "created_by">,
  viewerUserId: string | null | undefined,
  caps: HouseholdCapabilities | null | undefined
): boolean {
  if (!caps?.canDeleteOwnTransaction && !caps?.canDeleteAnyTransaction)
    return false;
  if (caps.canDeleteAnyTransaction) return true;
  return Boolean(
    caps.canDeleteOwnTransaction &&
      viewerUserId &&
      tx.created_by === viewerUserId
  );
}
