"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BudgetStatusBadge } from "@/features/budgets/components/BudgetStatusBadge";
import { monthLabel } from "@/features/budgets/lib/budget-selectors";
import type { MonthlyBudgetRow } from "@/features/budgets/types";
import { formatCurrencyMajor } from "@/lib/format/currency";

export function BudgetSummaryCard({
  budget,
  currency,
  locale,
  subtitle,
}: {
  budget: MonthlyBudgetRow;
  currency: string;
  locale: string | undefined;
  subtitle?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.375rem] border-border/85 shadow-soft">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
              {subtitle ?? `Budget · ${monthLabel(budget.year, budget.month)}`}
            </p>
            <CardTitle className="mt-1 text-xl font-semibold tracking-tight">
              {formatCurrencyMajor(budget.total_budget, currency, locale)} planned
            </CardTitle>
          </div>
          <BudgetStatusBadge status={budget.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Spent (derived)
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatCurrencyMajor(budget.total_spent, currency, locale)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Remaining
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatCurrencyMajor(budget.total_remaining, currency, locale)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
