import { describe, expect, it } from "vitest";

import { computeCategoryDerivedFields } from "@/features/budgets/lib/budget-aggregates";
import type { HouseholdCategoryRow } from "@/features/categories/types";

/**
 * Mirrors mapping in insertBudgetCategoriesFromHouseholdTemplates for regression coverage.
 */
function mapTemplateToBudgetRow(
  t: HouseholdCategoryRow,
  monthlyBudgetId: string,
  householdId: string,
  index: number
) {
  const planned = t.default_amount;
  const derived = computeCategoryDerivedFields({
    planned_amount: planned,
    adjusted_amount: planned,
    spent_amount: 0,
    id: "",
    monthly_budget_id: monthlyBudgetId,
    household_id: householdId,
    name: t.name,
    slug: "",
    category_type: t.category_type,
    display_order: t.display_order ?? index,
    color_token: null,
    icon_name: null,
    is_active: true,
    created_at: "",
    updated_at: "",
  });
  return {
    planned_amount: planned,
    adjusted_amount: planned,
    remaining_amount: derived.remaining_amount,
    usage_percent: derived.usage_percent,
    category_type: t.category_type,
    display_order: t.display_order ?? index,
  };
}

describe("Budget prefill from household templates", () => {
  it("copies default amount to planned and adjusted with zero spend", () => {
    const t: HouseholdCategoryRow = {
      id: "c1",
      household_id: "h1",
      name: "Food",
      slug: "food",
      category_type: "variable",
      default_amount: 300,
      display_order: 1,
      archived_at: null,
      created_at: "",
      updated_at: "",
    };
    const m = mapTemplateToBudgetRow(t, "mb1", "h1", 0);
    expect(m.planned_amount).toBe(300);
    expect(m.adjusted_amount).toBe(300);
    expect(m.remaining_amount).toBe(300);
    expect(m.category_type).toBe("variable");
    expect(m.display_order).toBe(1);
  });
});
