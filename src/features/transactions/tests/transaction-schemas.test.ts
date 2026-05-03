import { describe, expect, it } from "vitest";

import {
  quickAddExpenseSchema,
  createTransactionSchema,
} from "@/features/transactions/schemas/transaction.schemas";

describe("Quick add expense schema", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = quickAddExpenseSchema.safeParse({
      householdId: "550e8400-e29b-41d4-a716-446655440000",
      monthlyBudgetId: "550e8400-e29b-41d4-a716-446655440001",
      budgetCategoryId: "550e8400-e29b-41d4-a716-446655440002",
      amount: 12.5,
      note: null,
      transactionDate: "2026-05-02",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects non-positive amounts", () => {
    const parsed = quickAddExpenseSchema.safeParse({
      householdId: "550e8400-e29b-41d4-a716-446655440000",
      monthlyBudgetId: "550e8400-e29b-41d4-a716-446655440001",
      budgetCategoryId: "550e8400-e29b-41d4-a716-446655440002",
      amount: 0,
      transactionDate: "2026-05-02",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("Create transaction schema", () => {
  it("matches quick-add shape", () => {
    const a = quickAddExpenseSchema.shape;
    const b = createTransactionSchema.shape;
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort());
  });
});
