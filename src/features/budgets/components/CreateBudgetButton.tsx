"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BudgetPermissionGate } from "@/features/budgets/components/BudgetPermissionGate";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";

export function CreateBudgetButton() {
  const setOpen = useBudgetUiStore((s) => s.setCreateBudgetDialogOpen);

  return (
    <BudgetPermissionGate need={["canApproveBudget", "canCreateBudget"]}>
      <Button type="button" size="lg" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="size-[1.125rem]" strokeWidth={2.5} aria-hidden />
        Create monthly budget
      </Button>
    </BudgetPermissionGate>
  );
}
