"use client";

import { BUDGET_SUCCESS_SOLID_PILL } from "@/features/budgets/lib/budget-success-pill";
import { cn } from "@/lib/utils";
import type { MonthlyBudgetStatus } from "@/features/budgets/types";

const mutedStyles: Record<Exclude<MonthlyBudgetStatus, "active">, string> = {
  draft: "border-border/85 bg-muted/80 text-muted-foreground",
  closed: "border-border/90 bg-muted/60 text-muted-foreground",
};

const labels: Record<MonthlyBudgetStatus, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

function normalizeStatus(raw: string): MonthlyBudgetStatus {
  const s = String(raw ?? "").toLowerCase();
  if (s === "draft" || s === "active" || s === "closed") return s;
  return "draft";
}

export function BudgetStatusBadge({
  status: rawStatus,
}: {
  status: MonthlyBudgetStatus;
}) {
  const status = normalizeStatus(rawStatus);
  const isActive = status === "active";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide shadow-sm",
        !isActive && mutedStyles[status],
        isActive && BUDGET_SUCCESS_SOLID_PILL
      )}
      role="status"
    >
      {labels[status]}
    </span>
  );
}
