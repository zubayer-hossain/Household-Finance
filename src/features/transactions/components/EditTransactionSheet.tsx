"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BudgetCategoryRow } from "@/features/budgets/types";
import { TransactionCategorySelect } from "@/features/transactions/components/TransactionCategorySelect";
import { useUpdateTransactionMutation } from "@/features/transactions/hooks/use-update-transaction-mutation";
import { localISODate } from "@/features/transactions/lib/local-date";
import {
  updateTransactionSchema,
  type UpdateTransactionSchema,
} from "@/features/transactions/schemas/transaction.schemas";
import type { TransactionRow } from "@/features/transactions/types";

export function EditTransactionSheet({
  open,
  onOpenChange,
  householdId,
  monthlyBudgetId,
  categories,
  transaction,
  readOnly,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string | null;
  monthlyBudgetId: string | null;
  categories: BudgetCategoryRow[];
  transaction: TransactionRow | null;
  readOnly: boolean;
}) {
  const mut = useUpdateTransactionMutation(householdId);

  const form = useForm<UpdateTransactionSchema>({
    resolver: zodResolver(updateTransactionSchema) as Resolver<UpdateTransactionSchema>,
    defaultValues: {
      id: "",
      householdId: "",
      monthlyBudgetId: "",
      budgetCategoryId: "",
      amount: 0,
      note: "",
      transactionDate: localISODate(),
    },
  });

  useEffect(() => {
    if (!transaction) return;
    form.reset({
      id: transaction.id,
      householdId: transaction.household_id,
      monthlyBudgetId: transaction.monthly_budget_id,
      budgetCategoryId: transaction.budget_category_id,
      amount: transaction.amount,
      note: transaction.note,
      transactionDate: transaction.transaction_date,
    });
  }, [transaction, form]);

  const canSave =
    Boolean(
      householdId &&
        monthlyBudgetId &&
        transaction &&
        !readOnly &&
        categories.length
    );

  async function onSubmit(values: UpdateTransactionSchema) {
    if (!transaction) return;
    await mut.mutateAsync({
      ...values,
      id: transaction.id,
      householdId: transaction.household_id,
      monthlyBudgetId: transaction.monthly_budget_id,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(calc(100vw-2rem),28rem)] gap-4">
        <DialogHeader>
          <DialogTitle>Edit expense</DialogTitle>
          <DialogDescription>
            Changes stay within this household and open budget periods.
          </DialogDescription>
        </DialogHeader>

        {!transaction ? (
          <p className="text-sm text-muted-foreground">Loading expense…</p>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
            <TransactionCategorySelect
              id="edit-tx-cat"
              categories={categories}
              value={form.watch("budgetCategoryId") ?? ""}
              onChange={(id) => form.setValue("budgetCategoryId", id)}
              disabled={!canSave}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="edit-tx-amount">Amount</Label>
              <Input
                id="edit-tx-amount"
                inputMode="decimal"
                className="min-h-[2.875rem] rounded-xl text-lg font-semibold tabular-nums"
                disabled={!canSave}
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-tx-note">Note</Label>
              <textarea
                id="edit-tx-note"
                rows={3}
                className="min-h-[5rem] w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-[0.9375rem] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                disabled={!canSave}
                {...form.register("note")}
              />
            </div>
            <Controller
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-tx-date">Date</Label>
                  <Input
                    id="edit-tx-date"
                    type="date"
                    disabled={!canSave}
                    {...field}
                  />
                </div>
              )}
            />
            <Button
              type="submit"
              className="mt-1 min-h-[2.875rem] w-full rounded-xl"
              disabled={!canSave || mut.isPending}
            >
              {mut.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
