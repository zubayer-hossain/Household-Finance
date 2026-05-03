"use client";

import { Pencil, Archive, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HouseholdCategoryRow } from "@/features/categories/types";
import { formatCurrencyMajor } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export function HouseholdCategoryListItem({
  row,
  currency,
  locale,
  canManage,
  onEdit,
  onArchive,
  onRestore,
  archiving,
  restoring,
}: {
  row: HouseholdCategoryRow;
  currency: string;
  locale: string | undefined;
  canManage: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  archiving: boolean;
  restoring: boolean;
}) {
  const archived = Boolean(row.archived_at);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/85 bg-card px-4 py-3.5 shadow-soft sm:flex-row sm:items-center sm:justify-between",
        archived && "opacity-70"
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
            {row.name}
          </p>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {row.category_type}
          </span>
          {archived ? (
            <span className="inline-flex items-center rounded-md border border-amber-800/35 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-400/50 dark:bg-amber-950 dark:text-amber-50">
              Archived
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Default{" "}
          <span className="font-medium text-foreground">
            {formatCurrencyMajor(row.default_amount, currency, locale)}
          </span>
        </p>
      </div>
      {canManage && !archived ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={onEdit}
          >
            <Pencil className="mr-1.5 size-3.5" aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl text-muted-foreground hover:text-foreground"
            disabled={archiving}
            onClick={onArchive}
          >
            <Archive className="mr-1.5 size-3.5" aria-hidden />
            Archive
          </Button>
        </div>
      ) : null}
      {canManage && archived ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={restoring}
            onClick={onRestore}
          >
            <RotateCcw className="mr-1.5 size-3.5" aria-hidden />
            Restore
          </Button>
        </div>
      ) : null}
    </div>
  );
}
