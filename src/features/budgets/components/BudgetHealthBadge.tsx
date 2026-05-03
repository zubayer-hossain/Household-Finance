"use client";

import { BUDGET_SUCCESS_SOLID_PILL } from "@/features/budgets/lib/budget-success-pill";
import { cn } from "@/lib/utils";
import type { BudgetHealthState } from "@/features/budgets/types";

const variants: Record<
  BudgetHealthState,
  { label: string; className: string }
> = {
  safe: {
    label: "Safe",
    className: "",
  },
  warning: {
    label: "Watch",
    className:
      "border-amber-700/35 bg-amber-100 text-amber-950 dark:border-amber-500/55 dark:bg-amber-950/85 dark:text-amber-50",
  },
  danger: {
    label: "Tight",
    className:
      "border-orange-700/35 bg-orange-100 text-orange-950 dark:border-orange-500/55 dark:bg-orange-950/90 dark:text-orange-50",
  },
  over: {
    label: "Over",
    className:
      "border-destructive/60 bg-red-50 text-red-950 dark:bg-red-950/80 dark:border-destructive/70 dark:text-red-50",
  },
};

export function BudgetHealthBadge({ health }: { health: BudgetHealthState }) {
  const v = variants[health];
  const isSafe = health === "safe";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg border shadow-sm",
        isSafe ? BUDGET_SUCCESS_SOLID_PILL : "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        !isSafe && v.className
      )}
      role="status"
      aria-live="polite"
    >
      {v.label}
    </span>
  );
}
