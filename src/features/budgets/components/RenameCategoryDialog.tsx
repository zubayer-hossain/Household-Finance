"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

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
import { useRenameCategoryMutation } from "@/features/budgets/hooks/use-rename-category-mutation";
import { renameBudgetCategorySchema } from "@/features/budgets/schemas/budget.schemas";
import type { BudgetCategoryRow, MonthlyBudgetRow } from "@/features/budgets/types";

export function RenameCategoryDialog({
  householdId,
  monthlyBudget,
  category,
  open,
  onOpenChange,
}: {
  householdId: string;
  monthlyBudget: MonthlyBudgetRow;
  category: BudgetCategoryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");

  const rename = useRenameCategoryMutation({
    householdId,
    monthlyBudgetId: monthlyBudget.id,
    onSuccess: () => onOpenChange(false),
  });

  useEffect(() => {
    if (category) setName(category.name);
  }, [category]);

  function handleOpenChange(next: boolean) {
    if (!next) rename.reset();
    onOpenChange(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!category) return;
    const payload = renameBudgetCategorySchema.parse({
      householdId,
      monthlyBudgetId: monthlyBudget.id,
      categoryId: category.id,
      name,
    });
    await rename.mutateAsync(payload);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[min(calc(100vw-2rem),22rem)] max-w-none gap-6 md:w-[min(calc(100vw-4rem),28rem)]"
        aria-describedby="rename-category-desc"
      >
        <DialogHeader className="text-left">
          <DialogTitle>Rename category</DialogTitle>
          <DialogDescription id="rename-category-desc">
            This only changes how the category appears in your budget. Amounts stay the same.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-w-0 w-full flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="rename-cat-name">Name</Label>
            <Input
              id="rename-cat-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              disabled={rename.isPending}
              autoComplete="off"
            />
          </div>

          {rename.isError ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {rename.error instanceof Error ? rename.error.message : "Rename failed"}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="min-h-12 w-full font-semibold"
              disabled={rename.isPending}
            >
              {rename.isPending ? "Saving…" : "Save name"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              disabled={rename.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
