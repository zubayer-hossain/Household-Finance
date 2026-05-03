import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const quickAddExpenseSchema = z.object({
  householdId: z.string().uuid(),
  monthlyBudgetId: z.string().uuid(),
  budgetCategoryId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  note: z.string().max(2000).optional().nullable(),
  transactionDate: isoDate,
});

export type QuickAddExpenseSchema = z.infer<typeof quickAddExpenseSchema>;

export const createTransactionSchema = z.object({
  householdId: z.string().uuid(),
  monthlyBudgetId: z.string().uuid(),
  budgetCategoryId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  note: z.string().max(2000).optional().nullable(),
  transactionDate: isoDate,
});

export type CreateTransactionSchema = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  monthlyBudgetId: z.string().uuid().optional(),
  budgetCategoryId: z.string().uuid().optional(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().max(2000).optional().nullable(),
  transactionDate: isoDate.optional(),
});

export type UpdateTransactionSchema = z.infer<typeof updateTransactionSchema>;

export const deleteTransactionConfirmSchema = z.object({
  phrase: z.string(),
});
