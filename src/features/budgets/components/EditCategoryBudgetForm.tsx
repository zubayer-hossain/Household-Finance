"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyMajor } from "@/lib/format/currency";

const schema = z.object({
  adjustedAmount: z.preprocess((val) => {
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim() !== "") return Number(val);
    return 0;
  }, z.number().nonnegative("Must be zero or more")),
  reason: z.string().trim().max(500).optional(),
});

export type EditCategoryBudgetFormValues = z.infer<typeof schema>;

export function EditCategoryBudgetForm({
  plannedAmount,
  defaultAdjusted,
  currency,
  locale,
  disabled,
  showReason,
  submitLabel,
  onSubmit,
}: {
  plannedAmount: number;
  defaultAdjusted: number;
  currency: string;
  locale: string | undefined;
  disabled?: boolean;
  showReason?: boolean;
  submitLabel?: string;
  onSubmit: (values: EditCategoryBudgetFormValues) => void | Promise<void>;
}) {
  const form = useForm<EditCategoryBudgetFormValues>({
    resolver: zodResolver(schema) as Resolver<EditCategoryBudgetFormValues>,
    defaultValues: {
      adjustedAmount: defaultAdjusted,
      reason: "",
    },
  });

  useEffect(() => {
    form.reset({
      adjustedAmount: defaultAdjusted,
      reason: "",
    });
  }, [defaultAdjusted, form]);

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <p className="text-xs leading-relaxed text-muted-foreground">
        Original plan stays on record:{" "}
        <span className="font-semibold text-foreground">
          {formatCurrencyMajor(plannedAmount, currency, locale)}
        </span>
      </p>

      <div className="space-y-2">
        <Label htmlFor="adj-amount">New allocation amount</Label>
        <Input
          id="adj-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          disabled={disabled}
          {...form.register("adjustedAmount")}
        />
        {form.formState.errors.adjustedAmount ? (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.adjustedAmount.message}
          </p>
        ) : null}
      </div>

      {showReason ? (
        <div className="space-y-2">
          <Label htmlFor="adj-reason">Note for audit log (optional)</Label>
          <textarea
            id="adj-reason"
            disabled={disabled}
            rows={3}
            className="flex min-h-[5rem] w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-[0.9375rem] text-foreground shadow-soft transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/85 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register("reason")}
          />
          {form.formState.errors.reason ? (
            <p className="text-xs font-medium text-destructive">
              {form.formState.errors.reason.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={disabled}>
        {submitLabel ?? "Save"}
      </Button>
    </form>
  );
}
