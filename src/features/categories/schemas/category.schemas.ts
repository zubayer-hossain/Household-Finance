import { z } from "zod";

export const createHouseholdCategorySchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(120),
  categoryType: z.enum(["fixed", "variable"]),
  defaultAmount: z.number().nonnegative("Must be zero or more"),
});

export type CreateHouseholdCategorySchema = z.infer<
  typeof createHouseholdCategorySchema
>;

export const updateHouseholdCategorySchema = z.object({
  householdId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(120),
  categoryType: z.enum(["fixed", "variable"]),
  defaultAmount: z.number().nonnegative("Must be zero or more"),
});

export type UpdateHouseholdCategorySchema = z.infer<
  typeof updateHouseholdCategorySchema
>;

export const reorderHouseholdCategoriesSchema = z.object({
  householdId: z.string().uuid(),
  orderedCategoryIds: z
    .array(z.string().uuid())
    .min(1, "At least one category is required"),
});

export type ReorderHouseholdCategoriesSchema = z.infer<
  typeof reorderHouseholdCategoriesSchema
>;
