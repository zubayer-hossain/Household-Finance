import type { BudgetCategoryRow } from "@/features/budgets/types";

export function computeCategoryDerivedFields(c: Omit<BudgetCategoryRow, "remaining_amount" | "usage_percent"> & {
  remaining_amount?: number;
  usage_percent?: number;
}): Pick<BudgetCategoryRow, "remaining_amount" | "usage_percent"> {
  const spent = Number.isFinite(c.spent_amount) ? c.spent_amount : 0;
  const adjusted = Number.isFinite(c.adjusted_amount) ? c.adjusted_amount : 0;
  const remaining = adjusted - spent;
  const usage =
    adjusted > 0 ? Math.round((spent / adjusted) * 10000) / 100 : 0;
  return {
    remaining_amount: remaining,
    usage_percent: usage,
  };
}

export function sumCategoryAdjustedTotals(categories: BudgetCategoryRow[]): {
  sumAdjusted: number;
  sumSpent: number;
} {
  return categories.reduce(
    (acc, r) => {
      acc.sumAdjusted += r.adjusted_amount;
      acc.sumSpent += r.spent_amount;
      return acc;
    },
    { sumAdjusted: 0, sumSpent: 0 }
  );
}
