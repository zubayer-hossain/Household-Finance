"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EditCategoryBudgetForm } from "@/features/budgets/components/EditCategoryBudgetForm";
import { budgetAdjustmentSchema } from "@/features/budgets/schemas/budget.schemas";
import { useAdjustBudgetMutation } from "@/features/budgets/hooks/use-adjust-budget-mutation";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";
import type { BudgetCategoryRow } from "@/features/budgets/types";

export function BudgetAdjustmentSheet({
  householdId,
  monthlyBudgetId,
  categories,
  currency,
  locale,
}: {
  householdId: string;
  monthlyBudgetId: string;
  categories: BudgetCategoryRow[];
  currency: string;
  locale: string | undefined;
}) {
  const drawer = useBudgetUiStore((s) => s.adjustmentDrawer);
  const setDrawer = useBudgetUiStore((s) => s.setAdjustmentDrawer);
  const mutation = useAdjustBudgetMutation(householdId);

  const open = Boolean(drawer);
  const category = drawer
    ? categories.find((c) => c.id === drawer.categoryId)
    : undefined;
  const mode = drawer?.mode;
  const elevated = mode === "elevated";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setDrawer(null);
      }}
    >
      <DialogContent
        className="w-[min(calc(100vw-2rem),24rem)] max-h-[min(90dvh,36rem)] gap-6 overflow-y-auto pb-8"
        aria-describedby={undefined}
      >
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle>
            {elevated ? "Adjust allocation" : "Edit allocation"}
          </DialogTitle>
          <DialogDescription>
            {category ? (
              elevated ? (
                <>
                  Changing <span className="font-semibold text-foreground">{category.name}</span>.
                  Planned amount stays on record; add an optional note for your audit log.
                  When you save, everyone will see the new allocation totals.
                </>
              ) : (
                <>
                  Update how much budget is booked for{" "}
                  <span className="font-semibold text-foreground">{category.name}</span>.
                  Spent totals stay untouched (they sync from expense activity later).
                </>
              )
            ) : (
              "Pick a category from your list."
            )}
          </DialogDescription>
        </DialogHeader>

        {category && mode ? (
          <EditCategoryBudgetForm
            plannedAmount={category.planned_amount}
            defaultAdjusted={category.adjusted_amount}
            currency={currency}
            locale={locale}
            disabled={mutation.isPending}
            showReason={elevated}
            submitLabel={
              mutation.isPending
                ? "Saving…"
                : elevated
                  ? "Save with audit trail"
                  : "Save changes"
            }
            onSubmit={async (values) => {
              if (elevated) {
                const payload = budgetAdjustmentSchema.parse({
                  householdId,
                  monthlyBudgetId,
                  budgetCategoryId: category.id,
                  newAmount: values.adjustedAmount,
                  reason: values.reason?.trim() || undefined,
                });
                await mutation.mutateAsync({ kind: "elevated", payload });
              } else {
                await mutation.mutateAsync({
                  kind: "direct",
                  payload: {
                    monthlyBudgetId,
                    categoryId: category.id,
                    adjustedAmount: values.adjustedAmount,
                  },
                });
              }
              setDrawer(null);
            }}
          />
        ) : null}

        {mutation.isError ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Could not save"}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
