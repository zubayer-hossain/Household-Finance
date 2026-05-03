"use client";

import { Paperclip } from "lucide-react";

import type { TransactionRow } from "@/features/transactions/types";
import { formatCurrencyMajor } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export function TransactionListItem({
  transaction,
  currency,
  locale,
  onOpen,
}: {
  transaction: TransactionRow;
  currency: string;
  locale: string | undefined;
  onOpen: (id: string) => void;
}) {
  const title = transaction.category_name ?? "Expense";
  const notePreview =
    transaction.note && transaction.note.length > 0
      ? transaction.note.length > 56
        ? `${transaction.note.slice(0, 53)}…`
        : transaction.note
      : null;

  const attachments = transaction.attachment_count ?? 0;
  const attachmentLabel =
    attachments === 1
      ? "1 receipt attached"
      : `${attachments} receipts attached`;

  return (
    <button
      type="button"
      onClick={() => onOpen(transaction.id)}
      className={cn(
        "flex w-full flex-col gap-1 rounded-[1.25rem] border border-border/85 bg-card px-4 py-3.5 text-left shadow-soft transition-[border-color,transform] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-[0.9375rem] font-semibold tracking-tight text-foreground">
          {title}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {attachments > 0 ? (
            <span
              className="inline-flex items-center gap-0.5 rounded-md bg-muted/90 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/70"
              title={attachmentLabel}
            >
              <Paperclip className="size-3.5 shrink-0 opacity-90" aria-hidden />
              <span className="sr-only">{attachmentLabel}</span>
              <span aria-hidden>{attachments}</span>
            </span>
          ) : null}
          <span className="text-[0.9375rem] font-semibold tabular-nums text-foreground">
            {formatCurrencyMajor(transaction.amount, currency, locale)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <time dateTime={transaction.transaction_date}>
          {transaction.transaction_date}
        </time>
        {notePreview ? (
          <>
            <span aria-hidden className="text-border">
              ·
            </span>
            <span className="min-w-0 truncate">{notePreview}</span>
          </>
        ) : null}
      </div>
    </button>
  );
}
