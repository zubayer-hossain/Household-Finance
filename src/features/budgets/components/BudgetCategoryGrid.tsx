"use client";

import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddCategoryModal } from "@/features/budgets/components/AddCategoryModal";
import { BudgetCategoryCard } from "@/features/budgets/components/BudgetCategoryCard";
import { BudgetDeleteCategoryDialog } from "@/features/budgets/components/BudgetDeleteCategoryDialog";
import { RenameCategoryDialog } from "@/features/budgets/components/RenameCategoryDialog";
import { BudgetPermissionGate } from "@/features/budgets/components/BudgetPermissionGate";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";
import { useHouseholdCapabilities } from "@/features/household/hooks/use-household-capabilities";
import type { BudgetCategoryRow, MonthlyBudgetRow } from "@/features/budgets/types";

export function BudgetCategoryGrid({
  householdId,
  monthlyBudget,
  currency,
  locale,
  categories,
}: {
  householdId: string;
  monthlyBudget: MonthlyBudgetRow;
  currency: string;
  locale: string | undefined;
  categories: BudgetCategoryRow[];
}) {
  const caps = useHouseholdCapabilities();
  const setDrawer = useBudgetUiStore((s) => s.setAdjustmentDrawer);
  const setAddOpen = useBudgetUiStore((s) => s.setAddCategoryModalOpen);

  const readOnly = monthlyBudget.status === "closed";
  const canElevatedAdjust = Boolean(
    caps?.canApproveBudget && !readOnly
  );
  const canContributorEdit = Boolean(
    caps?.canEditBudget && !readOnly && !caps?.canApproveBudget
  );
  const canRemoveCategory = Boolean(
    caps?.canApproveBudget && !readOnly
  );
  const canRenameCategory = Boolean(caps?.canEditBudget && !readOnly);

  const [deleteTarget, setDeleteTarget] = useState<BudgetCategoryRow | null>(
    null
  );
  const [renameTarget, setRenameTarget] = useState<BudgetCategoryRow | null>(
    null
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
          Categories
        </h2>

        <BudgetPermissionGate need="canEditBudget" fallback={null}>
          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              className="shrink-0 gap-1.5 rounded-xl"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              Add category
            </Button>
          ) : null}
        </BudgetPermissionGate>
      </div>

      <AddCategoryModal
        householdId={householdId}
        monthlyBudget={monthlyBudget}
        currency={currency}
      />

      <BudgetDeleteCategoryDialog
        householdId={householdId}
        monthlyBudget={monthlyBudget}
        currency={currency}
        locale={locale}
        category={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />

      <RenameCategoryDialog
        householdId={householdId}
        monthlyBudget={monthlyBudget}
        category={renameTarget}
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <BudgetCategoryCard
            key={cat.id}
            category={cat}
            currency={currency}
            locale={locale}
            readOnly={readOnly}
            canElevatedAdjust={canElevatedAdjust}
            canDirectEdit={canContributorEdit}
            canRemoveCategory={canRemoveCategory}
            canRename={canRenameCategory}
            onElevatedAdjust={() =>
              setDrawer({ categoryId: cat.id, mode: "elevated" })
            }
            onDirectEdit={() =>
              setDrawer({ categoryId: cat.id, mode: "direct" })
            }
            onRequestRename={() => setRenameTarget(cat)}
            onRequestRemove={() => setDeleteTarget(cat)}
          />
        ))}
      </div>
    </section>
  );
}
