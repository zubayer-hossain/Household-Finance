import type { BudgetHealthState } from "@/features/budgets/types";

/** Spec: thresholds on usage_percent (0–∞; typically 0–100+). */
export function deriveBudgetHealth(usagePercent: number): BudgetHealthState {
  if (!Number.isFinite(usagePercent)) return "safe";
  if (usagePercent > 100) return "over";
  if (usagePercent >= 90) return "danger";
  if (usagePercent >= 70) return "warning";
  return "safe";
}
