"use client";

import { Button } from "@/components/ui/button";
import { BudgetHealthBadge } from "@/features/budgets/components/BudgetHealthBadge";
import { BudgetProgressBar } from "@/features/budgets/components/BudgetProgressBar";
import { deriveBudgetHealth } from "@/features/budgets/lib/budget-health";
import type { BudgetCategoryRow } from "@/features/budgets/types";
import { formatCurrencyMajor } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { Pencil, SlidersHorizontal, Trash2 } from "lucide-react";

export function BudgetCategoryCard({
  category,
  currency,
  locale,
  readOnly,
  canElevatedAdjust,
  canDirectEdit,
  canRename,
  canRemoveCategory,
  onElevatedAdjust,
  onDirectEdit,
  onRequestRename,
  onRequestRemove,
}: {
  category: BudgetCategoryRow;
  currency: string;
  locale: string | undefined;
  readOnly: boolean;
  canElevatedAdjust: boolean;
  canDirectEdit: boolean;
  canRename: boolean;
  canRemoveCategory: boolean;
  onElevatedAdjust: () => void;
  onDirectEdit: () => void;
  onRequestRename: () => void;
  onRequestRemove: () => void;
}) {
  const health = deriveBudgetHealth(category.usage_percent);
  const showEditModal =
    !readOnly && (canElevatedAdjust || canDirectEdit);
  const showRemoveConfirm = !readOnly && canRemoveCategory;
  const showRename = !readOnly && canRename;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-[1.25rem] border border-border/85 bg-card p-4 shadow-soft",
        readOnly ? "opacity-95" : ""
      )}
      aria-labelledby={`category-${category.id}-title`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            id={`category-${category.id}-title`}
            className="text-[1rem] font-semibold leading-tight tracking-tight text-foreground"
          >
            {category.name}
          </h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {category.category_type} · Planned{" "}
            {formatCurrencyMajor(category.planned_amount, currency, locale)}
          </p>
        </div>
        <BudgetHealthBadge health={health} />
      </header>

      <BudgetProgressBar usagePercent={category.usage_percent} health={health} />

      <dl className="grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <dt className="text-[11px] font-medium uppercase text-muted-foreground">
            Adjusted
          </dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {formatCurrencyMajor(category.adjusted_amount, currency, locale)}
          </dd>
        </div>
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <dt className="text-[11px] font-medium uppercase text-muted-foreground">
            Spent
          </dt>
          <dd className="font-semibold tabular-nums text-muted-foreground">
            {formatCurrencyMajor(category.spent_amount, currency, locale)}
          </dd>
        </div>
        <div className="col-span-2 rounded-xl bg-muted/50 px-3 py-2">
          <dt className="text-[11px] font-medium uppercase text-muted-foreground">
            Remaining · usage
          </dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {formatCurrencyMajor(category.remaining_amount, currency, locale)} ·{" "}
            {category.usage_percent.toFixed(0)}%
          </dd>
        </div>
      </dl>

      {showEditModal || showRename || showRemoveConfirm ? (
        <footer
          className="flex flex-wrap items-center justify-end gap-1 border-t border-border/60 pt-2.5"
          aria-label="Category actions"
        >
          {showEditModal ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 min-h-9 min-w-9 shrink-0 rounded-lg"
              title={
                canElevatedAdjust ? "Adjust allocation" : "Edit allocation"
              }
              aria-label={
                canElevatedAdjust ? "Adjust allocation" : "Edit allocation"
              }
              onClick={canElevatedAdjust ? onElevatedAdjust : onDirectEdit}
            >
              <SlidersHorizontal aria-hidden />
            </Button>
          ) : null}
          {showRename ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 min-h-9 min-w-9 shrink-0 rounded-lg"
              title="Rename category"
              aria-label="Rename category"
              onClick={onRequestRename}
            >
              <Pencil aria-hidden />
            </Button>
          ) : null}
          {showRemoveConfirm ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 min-h-9 min-w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Remove category"
              aria-label="Remove category"
              onClick={onRequestRemove}
            >
              <Trash2 aria-hidden />
            </Button>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}
