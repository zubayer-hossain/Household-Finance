"use client";

import type { FormEvent } from "react";
import { useEffect, useRef } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { NativeSelect } from "@/components/ui/native-select";
import { monthLabel } from "@/features/budgets/lib/budget-selectors";
import { createBudgetCategorySeedSchema } from "@/features/budgets/schemas/budget.schemas";
import { budgetService } from "@/features/budgets/services/budget.service";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";
import type { MonthlyBudgetRow } from "@/features/budgets/types";
import { qk } from "@/lib/query-keys";

export function AddCategoryModal({
  householdId,
  monthlyBudget,
  currency,
}: {
  householdId: string;
  monthlyBudget: MonthlyBudgetRow;
  currency: string;
}) {
  const open = useBudgetUiStore((s) => s.addCategoryModalOpen);
  const setOpen = useBudgetUiStore((s) => s.setAddCategoryModalOpen);
  const formRef = useRef<HTMLFormElement>(null);

  const qc = useQueryClient();
  const createCat = useMutation({
    mutationFn: (raw: {
      name: string;
      categoryType: "fixed" | "variable";
      plannedAmount: number;
    }) => {
      const parsed = createBudgetCategorySeedSchema.parse({
        householdId,
        monthlyBudgetId: monthlyBudget.id,
        name: raw.name,
        categoryType: raw.categoryType,
        plannedAmount: raw.plannedAmount,
      });
      return budgetService.createBudgetCategory(parsed);
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: qk.budgetCategories(monthlyBudget.id),
      });
      void qc.invalidateQueries({ queryKey: qk.budget(monthlyBudget.id) });
      void qc.invalidateQueries({ queryKey: qk.budgets(householdId) });
      setOpen(false);
      formRef.current?.reset();
    },
  });

  useEffect(() => {
    if (open) formRef.current?.reset();
  }, [open]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("cat-name") ?? "").trim();
    const categoryType = fd.get("cat-type") as "fixed" | "variable";
    const plannedRaw = fd.get("cat-planned");
    const plannedAmount =
      typeof plannedRaw === "string" && plannedRaw.trim() !== ""
        ? Number(plannedRaw)
        : 0;
    try {
      await createCat.mutateAsync({ name, categoryType, plannedAmount });
    } catch {
      /* surfaced */
    }
  }

  const when = monthLabel(monthlyBudget.year, monthlyBudget.month);
  const cur = currency.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[min(calc(100vw-2rem),22rem)] max-w-none min-w-0 gap-6 md:w-[min(calc(100vw-4rem),32rem)]"
        aria-describedby="add-category-desc"
      >
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            New category
          </DialogTitle>
          <DialogDescription
            id="add-category-desc"
            className="text-[0.9375rem] leading-snug text-muted-foreground"
          >
            {when}
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="flex min-w-0 w-full flex-col gap-5"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="modal-cat-name" className="text-foreground">
              Name
            </Label>
            <Input
              id="modal-cat-name"
              name="cat-name"
              required
              maxLength={120}
              placeholder="Rent, Groceries, Transport…"
              disabled={createCat.isPending}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-cat-type" className="text-foreground">
              Type
            </Label>
            <NativeSelect
              id="modal-cat-type"
              name="cat-type"
              defaultValue="variable"
              disabled={createCat.isPending}
            >
              <option value="variable">Variable spending</option>
              <option value="fixed">Fixed cost</option>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-cat-planned" className="text-foreground">
              Amount ({cur})
            </Label>
            <Input
              id="modal-cat-planned"
              name="cat-planned"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              required
              defaultValue={0}
              disabled={createCat.isPending}
            />
          </div>

          {createCat.isError ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {createCat.error instanceof Error
                ? createCat.error.message
                : "Something went wrong"}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="min-h-12 w-full text-base font-semibold"
              disabled={createCat.isPending}
            >
              {createCat.isPending ? "Adding…" : "Add"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full text-muted-foreground"
              disabled={createCat.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
