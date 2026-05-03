import { z } from "zod";

export const createMonthlyBudgetSchema = z.object({
  householdId: z.string().uuid(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});
export type CreateMonthlyBudgetSchema = z.infer<typeof createMonthlyBudgetSchema>;

export const createBudgetCategorySeedSchema = z.object({
  householdId: z.string().uuid(),
  monthlyBudgetId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(120),
  categoryType: z.enum(["fixed", "variable"]),
  plannedAmount: z.number().nonnegative("Must be zero or more"),
});

export type CreateBudgetCategorySeedSchema = z.infer<
  typeof createBudgetCategorySeedSchema
>;

export const editCategoryBudgetSchema = z.object({
  householdId: z.string().uuid(),
  monthlyBudgetId: z.string().uuid(),
  categoryId: z.string().uuid(),
  adjustedAmount: z.number().nonnegative("Must be zero or more"),
});

export type EditCategoryBudgetSchema = z.infer<typeof editCategoryBudgetSchema>;

export const budgetAdjustmentSchema = z.object({
  householdId: z.string().uuid(),
  monthlyBudgetId: z.string().uuid(),
  budgetCategoryId: z.string().uuid(),
  newAmount: z.number().nonnegative("Must be zero or more"),
  reason: z.string().trim().max(500).optional(),
});

export type BudgetAdjustmentSchema = z.infer<typeof budgetAdjustmentSchema>;

export const budgetReallocationSchema = z
  .object({
    householdId: z.string().uuid(),
    monthlyBudgetId: z.string().uuid(),
    fromCategoryId: z.string().uuid(),
    toCategoryId: z.string().uuid(),
    amount: z.number().positive("Amount must be greater than zero"),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.fromCategoryId !== d.toCategoryId, {
    message: "Choose two different categories",
    path: ["toCategoryId"],
  });

export type BudgetReallocationSchema = z.infer<typeof budgetReallocationSchema>;

export const renameBudgetCategorySchema = z.object({
  householdId: z.string().uuid(),
  monthlyBudgetId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(120),
});

export type RenameBudgetCategorySchema = z.infer<typeof renameBudgetCategorySchema>;
