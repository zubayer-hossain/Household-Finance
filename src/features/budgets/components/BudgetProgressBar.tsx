"use client";

import { cn } from "@/lib/utils";
import type { BudgetHealthState } from "@/features/budgets/types";

function barTone(health: BudgetHealthState): string {
  switch (health) {
    case "safe":
      return "bg-emerald-500";
    case "warning":
      return "bg-amber-500";
    case "danger":
      return "bg-orange-500";
    case "over":
      return "bg-destructive";
    default:
      return "bg-muted-foreground";
  }
}

export function BudgetProgressBar({
  usagePercent,
  health,
}: {
  usagePercent: number;
  health: BudgetHealthState;
}) {
  const pct = Number.isFinite(usagePercent) ? usagePercent : 0;
  const fill = Math.min(100, Math.max(0, pct));

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted/90"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Category budget usage"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          barTone(health)
        )}
        style={{ width: `${fill}%` }}
      />
    </div>
  );
}
