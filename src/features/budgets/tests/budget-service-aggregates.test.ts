import { describe, expect, it } from "vitest";

import { sumCategoryAdjustedTotals } from "@/features/budgets/lib/budget-aggregates";
import type { BudgetCategoryRow } from "@/features/budgets/types";

function cat(adjusted: number, spent: number): BudgetCategoryRow {
  return {
    id: "c1",
    monthly_budget_id: "m1",
    household_id: "h1",
    name: "Test",
    slug: "test",
    category_type: "variable",
    planned_amount: adjusted,
    adjusted_amount: adjusted,
    spent_amount: spent,
    remaining_amount: adjusted - spent,
    usage_percent: adjusted > 0 ? (spent / adjusted) * 100 : 0,
    display_order: 0,
    color_token: null,
    icon_name: null,
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

describe("sumCategoryAdjustedTotals (budget rollup)", () => {
  it("sums adjusted and spent for monthly budget totals refresh", () => {
    const result = sumCategoryAdjustedTotals([
      cat(100, 30),
      cat(200, 50),
    ]);
    expect(result.sumAdjusted).toBe(300);
    expect(result.sumSpent).toBe(80);
  });
});
