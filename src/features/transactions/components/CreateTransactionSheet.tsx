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
import { useCreateTransactionMutation } from "@/features/transactions/hooks/use-create-transaction-mutation";
import { localISODate } from "@/features/transactions/lib/local-date";
import {
  createTransactionSchema,
  type CreateTransactionSchema,
} from "@/features/transactions/schemas/transaction.schemas";

export function CreateTransactionSheet({
  open,
  onOpenChange,
  householdId,
  monthlyBudgetId,
  categories,
  readOnly,
  actorUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string | null;
  monthlyBudgetId: string | null;
  categories: BudgetCategoryRow[];
  readOnly: boolean;
  actorUserId: string | null;
}) {
  const mut = useCreateTransactionMutation(householdId);

  const form = useForm<CreateTransactionSchema>({
    resolver: zodResolver(createTransactionSchema) as Resolver<CreateTransactionSchema>,
    defaultValues: {
      householdId: householdId ?? "",
      monthlyBudgetId: monthlyBudgetId ?? "",
      budgetCategoryId: categories[0]?.id ?? "",
      amount: undefined as unknown as number,
      note: "",
      transactionDate: localISODate(),
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      householdId: householdId ?? "",
      monthlyBudgetId: monthlyBudgetId ?? "",
      budgetCategoryId: categories[0]?.id ?? "",
      amount: undefined as unknown as number,
      note: "",
      transactionDate: localISODate(),
    });
  }, [open, householdId, monthlyBudgetId, categories, form]);

  const canSave =
    Boolean(
      householdId &&
        monthlyBudgetId &&
        actorUserId &&
        !readOnly &&
        categories.length
    );

  async function onSubmit(values: CreateTransactionSchema) {
    if (!actorUserId) return;
    await mut.mutateAsync({
      input: {
        ...values,
        note: values.note?.trim() ? values.note.trim() : null,
      },
      actorUserId,
    });
    onOpenChange(false);
    form.reset({
      householdId: householdId ?? "",
      monthlyBudgetId: monthlyBudgetId ?? "",
      budgetCategoryId: categories[0]?.id ?? "",
      amount: undefined as unknown as number,
      note: "",
      transactionDate: localISODate(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(calc(100vw-2rem),28rem)] gap-4">
        <DialogHeader>
          <DialogTitle>New expense</DialogTitle>
          <DialogDescription>
            Log amount, category, and date. Attach receipts after saving from the detail view.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          <TransactionCategorySelect
            id="create-tx-cat"
            categories={categories}
            value={form.watch("budgetCategoryId")}
            onChange={(id) => form.setValue("budgetCategoryId", id)}
            disabled={!canSave}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="create-tx-amount">Amount</Label>
            <Input
              id="create-tx-amount"
              inputMode="decimal"
              className="min-h-[2.875rem] rounded-xl text-lg font-semibold tabular-nums"
              disabled={!canSave}
              {...form.register("amount", { valueAsNumber: true })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="create-tx-note">Note</Label>
            <textarea
              id="create-tx-note"
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
                <Label htmlFor="create-tx-date">Date</Label>
                <Input
                  id="create-tx-date"
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
            {mut.isPending ? "Saving…" : "Save expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
