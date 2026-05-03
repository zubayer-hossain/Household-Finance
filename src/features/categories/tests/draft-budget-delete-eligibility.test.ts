import { describe, expect, it } from "vitest";

import { evaluateDraftBudgetDeleteEligibility } from "@/features/categories/services/draft-budget.service";
import type { MonthlyBudgetRow } from "@/features/budgets/types";

function row(partial: Partial<MonthlyBudgetRow>): MonthlyBudgetRow {
  return {
    id: "b1",
    household_id: "h1",
    year: 2026,
    month: 5,
    total_budget: 0,
    total_spent: 0,
    total_remaining: 0,
    forecast_spent: 0,
    forecast_savings: 0,
    status: "draft",
    approved_by: null,
    approved_at: null,
    closed_at: null,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("evaluateDraftBudgetDeleteEligibility", () => {
  it("blocks when budget missing", () => {
    const r = evaluateDraftBudgetDeleteEligibility(undefined, 0);
    expect(r.canDelete).toBe(false);
    expect(r.reason).toMatch(/load/i);
  });

  it("blocks active and closed", () => {
    expect(
      evaluateDraftBudgetDeleteEligibility(row({ status: "active" }), 0).canDelete
    ).toBe(false);
    expect(
      evaluateDraftBudgetDeleteEligibility(row({ status: "closed" }), 0).canDelete
    ).toBe(false);
  });

  it("blocks when transactions exist", () => {
    const r = evaluateDraftBudgetDeleteEligibility(row({ status: "draft" }), 2);
    expect(r.canDelete).toBe(false);
    expect(r.reason).toMatch(/2/);
  });

  it("allows empty draft", () => {
    const r = evaluateDraftBudgetDeleteEligibility(row({ status: "draft" }), 0);
    expect(r.canDelete).toBe(true);
  });
});
