import { describe, expect, it } from "vitest";

import {
  createHouseholdCategorySchema,
  reorderHouseholdCategoriesSchema,
  updateHouseholdCategorySchema,
} from "@/features/categories/schemas/category.schemas";

describe("category.schemas", () => {
  it("parses create household category", () => {
    const parsed = createHouseholdCategorySchema.safeParse({
      householdId: "00000000-0000-4000-8000-000000000001",
      name: " Groceries ",
      categoryType: "variable",
      defaultAmount: 450,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Groceries");
    }
  });

  it("parses update household category", () => {
    const parsed = updateHouseholdCategorySchema.safeParse({
      householdId: "00000000-0000-4000-8000-000000000001",
      categoryId: "00000000-0000-4000-8000-000000000002",
      name: "Rent",
      categoryType: "fixed",
      defaultAmount: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects negative default amount", () => {
    const parsed = createHouseholdCategorySchema.safeParse({
      householdId: "00000000-0000-4000-8000-000000000001",
      name: "X",
      categoryType: "fixed",
      defaultAmount: -1,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty reorder list", () => {
    const parsed = reorderHouseholdCategoriesSchema.safeParse({
      householdId: "00000000-0000-4000-8000-000000000001",
      orderedCategoryIds: [],
    });
    expect(parsed.success).toBe(false);
  });
});
