import { describe, expect, it } from "vitest";

import { pickActiveMonthlyBudget } from "@/features/budgets/lib/budget-selectors";
import type { MonthlyBudgetRow } from "@/features/budgets/types";

function row(
  id: string,
  year: number,
  month: number,
  status: MonthlyBudgetRow["status"]
): MonthlyBudgetRow {
  return {
    id,
    household_id: "h1",
    year,
    month,
    total_budget: 0,
    total_spent: 0,
    total_remaining: 0,
    forecast_spent: 0,
    forecast_savings: 0,
    status,
    approved_by: null,
    approved_at: null,
    closed_at: null,
    created_at: "",
    updated_at: "",
  };
}

describe("pickActiveMonthlyBudget", () => {
  it("returns null when no active rows", () => {
    expect(
      pickActiveMonthlyBudget([
        row("a", 2026, 1, "draft"),
        row("b", 2026, 2, "closed"),
      ])
    ).toBeNull();
  });

  it("returns the latest calendar period among actives", () => {
    const picked = pickActiveMonthlyBudget([
      row("a", 2026, 1, "active"),
      row("b", 2026, 3, "active"),
      row("c", 2025, 12, "active"),
    ]);
    expect(picked?.id).toBe("b");
  });
});
