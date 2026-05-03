"use client";

import type { TransactionRow } from "@/features/transactions/types";
import { TransactionListItem } from "@/features/transactions/components/TransactionListItem";

export function TransactionList({
  transactions,
  currency,
  locale,
  onOpenDetail,
}: {
  transactions: TransactionRow[];
  currency: string;
  locale: string | undefined;
  onOpenDetail: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2.5" aria-label="Transactions">
      {transactions.map((t) => (
        <li key={t.id}>
          <TransactionListItem
            transaction={t}
            currency={currency}
            locale={locale}
            onOpen={onOpenDetail}
          />
        </li>
      ))}
    </ul>
  );
}
