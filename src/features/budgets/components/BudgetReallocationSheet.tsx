"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

import {
  budgetReallocationSchema,
  type BudgetReallocationSchema,
} from "@/features/budgets/schemas/budget.schemas";
import { useReallocateBudgetMutation } from "@/features/budgets/hooks/use-reallocate-budget-mutation";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";
import type { BudgetCategoryRow } from "@/features/budgets/types";
import { Input } from "@/components/ui/input";

export function BudgetReallocationSheet({
  householdId,
  monthlyBudgetId,
  categories,
}: {
  householdId: string;
  monthlyBudgetId: string;
  categories: BudgetCategoryRow[];
}) {
  const open = useBudgetUiStore((s) => s.reallocationOpen);
  const setOpen = useBudgetUiStore((s) => s.setReallocationOpen);
  const mutation = useReallocateBudgetMutation(householdId);

  const form = useForm<BudgetReallocationSchema>({
    resolver: zodResolver(budgetReallocationSchema),
    defaultValues: {
      householdId,
      monthlyBudgetId,
      fromCategoryId: categories[0]?.id ?? "",
      toCategoryId: categories[1]?.id ?? categories[0]?.id ?? "",
      amount: 0,
      reason: "",
    },
  });

  useEffect(() => {
    if (categories.length < 2 || !open) return;
    form.reset({
      householdId,
      monthlyBudgetId,
      fromCategoryId: categories[0]!.id,
      toCategoryId: categories[1]!.id,
      amount: 0,
      reason: "",
    });
  }, [categories, householdId, monthlyBudgetId, open, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset({
            householdId,
            monthlyBudgetId,
            fromCategoryId: categories[0]?.id ?? "",
            toCategoryId: categories[1]?.id ?? categories[0]?.id ?? "",
            amount: 0,
            reason: "",
          });
        }
      }}
    >
      <DialogContent
        className="w-[min(calc(100vw-2rem),24rem)]"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Reallocate</DialogTitle>
          <DialogDescription>
            Move planned dollars from one category to another. Owner or admin only.
          </DialogDescription>
        </DialogHeader>

        {categories.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Add at least two categories before reallocating.
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await mutation.mutateAsync(values);
              setOpen(false);
            })}
            noValidate
          >
            <input type="hidden" {...form.register("householdId")} />
            <input type="hidden" {...form.register("monthlyBudgetId")} />

            <div className="space-y-2">
              <Label htmlFor="from-cat">From</Label>
              <NativeSelect
                id="from-cat"
                disabled={mutation.isPending}
                {...form.register("fromCategoryId")}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-cat">To</Label>
              <NativeSelect
                id="to-cat"
                disabled={mutation.isPending}
                {...form.register("toCategoryId")}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            {form.formState.errors.toCategoryId ? (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.toCategoryId.message}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="re-amount">Amount</Label>
              <Input
                id="re-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                disabled={mutation.isPending}
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="re-reason">Reason (optional)</Label>
              <textarea
                id="re-reason"
                rows={2}
                disabled={mutation.isPending}
                className="flex min-h-[4rem] w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-[0.9375rem] text-foreground shadow-soft placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/85"
                {...form.register("reason")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Moving…" : "Move allocation"}
            </Button>
          </form>
        )}

        {mutation.isError ? (
          <p className="text-sm font-medium text-destructive">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Could not reallocate"}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
