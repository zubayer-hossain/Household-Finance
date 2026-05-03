import type { MonthlyBudgetRow } from "@/features/budgets/types";

/** Latest row with `active` status (by calendar period). */
export function pickActiveMonthlyBudget(
  rows: MonthlyBudgetRow[]
): MonthlyBudgetRow | null {
  const actives = rows.filter((r) => r.status === "active");
  if (actives.length === 0) return null;
  return [...actives].sort(
    (a, b) => b.year - a.year || b.month - a.month
  )[0]!;
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}
