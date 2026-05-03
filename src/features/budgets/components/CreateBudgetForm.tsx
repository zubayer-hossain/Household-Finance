"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

import {
  createMonthlyBudgetSchema,
  type CreateMonthlyBudgetSchema,
} from "@/features/budgets/schemas/budget.schemas";
import { useCreateBudgetMutation } from "@/features/budgets/hooks/use-create-budget-mutation";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString(undefined, { month: "long" }),
}));

export function CreateBudgetForm({
  householdId,
  onCompleted,
}: {
  householdId: string;
  onCompleted?: () => void;
}) {
  const setOpen = useBudgetUiStore((s) => s.setCreateBudgetDialogOpen);
  const now = new Date();
  const mutation = useCreateBudgetMutation(householdId);

  const form = useForm({
    resolver: zodResolver(createMonthlyBudgetSchema),
    defaultValues: {
      householdId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    },
  });

  useEffect(() => {
    form.setValue("householdId", householdId);
  }, [householdId, form]);

  const yearChoices = [-1, 0, 1].map((d) => now.getFullYear() + d);

  async function onSubmit(values: CreateMonthlyBudgetSchema) {
    try {
      await mutation.mutateAsync(values);
      onCompleted?.();
      setOpen(false);
      form.reset({
        householdId,
        year: values.year,
        month: values.month,
      });
    } catch {
      /* surfaced below */
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="budget-year">Year</Label>
        <NativeSelect
          id="budget-year"
          disabled={mutation.isPending}
          {...form.register("year", { valueAsNumber: true })}
        >
          {yearChoices.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </NativeSelect>
        {form.formState.errors.year ? (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.year.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget-month">Month</Label>
        <NativeSelect
          id="budget-month"
          disabled={mutation.isPending}
          {...form.register("month", { valueAsNumber: true })}
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </NativeSelect>
        {form.formState.errors.month ? (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.month.message}
          </p>
        ) : null}
      </div>

      <input type="hidden" {...form.register("householdId")} />

      {mutation.isError ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Could not create budget"}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating…" : "Create draft budget"}
      </Button>
    </form>
  );
}
