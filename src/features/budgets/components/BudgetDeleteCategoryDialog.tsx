"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { budgetService } from "@/features/budgets/services/budget.service";
import type { BudgetCategoryRow, MonthlyBudgetRow } from "@/features/budgets/types";
import { formatCurrencyMajor } from "@/lib/format/currency";
import { qk } from "@/lib/query-keys";

export function BudgetDeleteCategoryDialog({
  householdId,
  monthlyBudget,
  currency,
  locale,
  category,
  open,
  onOpenChange,
}: {
  householdId: string;
  monthlyBudget: MonthlyBudgetRow;
  currency: string;
  locale: string | undefined;
  category: BudgetCategoryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();

  const deletion = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("No category selected");
      return budgetService.deleteBudgetCategory({
        householdId,
        monthlyBudgetId: monthlyBudget.id,
        categoryId: category.id,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: qk.budgetCategories(monthlyBudget.id),
      });
      void qc.invalidateQueries({ queryKey: qk.budget(monthlyBudget.id) });
      void qc.invalidateQueries({ queryKey: qk.budgets(householdId) });
      onOpenChange(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) deletion.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[min(calc(100vw-2rem),22rem)]"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Remove this category?</DialogTitle>
          <DialogDescription className="text-left">
            {category ? (
              <>
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">{category.name}</span>{" "}
                ({formatCurrencyMajor(category.adjusted_amount, currency, locale)} adjusted).
                You cannot undo this from the app. If expenses are already linked here, the remove
                will fail until those records are moved.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {deletion.isError ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {deletion.error instanceof Error
              ? deletion.error.message
              : "Could not remove category"}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={deletion.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={deletion.isPending || !category}
            onClick={() => deletion.mutate()}
          >
            {deletion.isPending ? "Removing…" : "Remove category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
