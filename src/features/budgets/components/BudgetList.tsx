"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { BudgetStatusBadge } from "@/features/budgets/components/BudgetStatusBadge";
import { monthLabel } from "@/features/budgets/lib/budget-selectors";
import type { MonthlyBudgetRow } from "@/features/budgets/types";
import { formatCurrencyMajor } from "@/lib/format/currency";

const rowCls =
  "group flex items-center gap-3 rounded-[1.25rem] border border-border/85 bg-card px-4 py-3.5 text-left shadow-soft transition-[border-color,transform] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-primary/20";

export function BudgetList({
  budgets,
  currency,
  locale,
}: {
  budgets: MonthlyBudgetRow[];
  currency: string;
  locale: string | undefined;
}) {
  return (
    <ul className="flex flex-col gap-2.5" aria-label="Monthly budgets">
      {budgets.map((b) => (
        <li key={b.id}>
          <BudgetListItem budget={b} currency={currency} locale={locale} />
        </li>
      ))}
    </ul>
  );
}

export function BudgetListItem({
  budget,
  currency,
  locale,
}: {
  budget: MonthlyBudgetRow;
  currency: string;
  locale: string | undefined;
}) {
  return (
    <Link href={`/app/budgets/${budget.id}`} className={cn(rowCls, "flex")}>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[0.9375rem] font-semibold tracking-tight">
            {monthLabel(budget.year, budget.month)}
          </span>
          <BudgetStatusBadge status={budget.status} />
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          Adjusted budget {formatCurrencyMajor(budget.total_budget, currency, locale)}{" "}
          · remaining {formatCurrencyMajor(budget.total_remaining, currency, locale)}
        </span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground opacity-65 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </Link>
  );
}
