"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetList } from "@/features/budgets/components/BudgetList";
import { BudgetPermissionGate } from "@/features/budgets/components/BudgetPermissionGate";
import { BudgetSummaryCard } from "@/features/budgets/components/BudgetSummaryCard";
import { CreateBudgetButton } from "@/features/budgets/components/CreateBudgetButton";
import { CreateBudgetForm } from "@/features/budgets/components/CreateBudgetForm";
import { EmptyBudgetState } from "@/features/budgets/components/EmptyBudgetState";
import { pickActiveMonthlyBudget } from "@/features/budgets/lib/budget-selectors";
import { useBudgetsQuery } from "@/features/budgets/hooks/use-budgets-query";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";
import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function BudgetsRouteIndex() {
  const activeHouseholdId = useAppShellStore((s) => s.activeHouseholdId);
  const createOpen = useBudgetUiStore((s) => s.createBudgetDialogOpen);
  const setCreateOpen = useBudgetUiStore((s) => s.setCreateBudgetDialogOpen);
  const { data: memberships } = useHouseholdMembershipsQuery(true);

  const activeHousehold = memberships?.find(
    (m) => m.householdId === activeHouseholdId
  );

  const currency = activeHousehold?.household.base_currency ?? "USD";

  const { data: budgets, isLoading, isError, error } = useBudgetsQuery(
    activeHouseholdId,
    Boolean(activeHouseholdId)
  );

  const activeBudget =
    budgets && budgets.length > 0 ? pickActiveMonthlyBudget(budgets) : null;

  return (
    <BudgetPermissionGate
      need="canViewBudgets"
      fallback={
        <p className="text-sm font-medium text-muted-foreground">
          You do not have access to household budgets.
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <header className="space-y-2">
          <p className="eyebrow">Planning</p>
          <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
            Budgets
          </h1>
          <p className="max-w-[28rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
            Monthly budgets for your active household. Open a month to plan categories,
            adjust allocations, and close the period when you are ready.
          </p>
        </header>

        <CreateBudgetButton />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-[1.375rem]" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : null}

        {isError ? (
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : "Could not load budgets"}
          </p>
        ) : null}

        {!isLoading && !isError && budgets && activeBudget ? (
          <section className="space-y-2" aria-label="Active budget summary">
            <h2 className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Active budget
            </h2>
            <BudgetSummaryCard
              budget={activeBudget}
              currency={currency}
              locale={undefined}
            />
          </section>
        ) : null}

        {!isLoading && !isError && budgets && budgets.length === 0 ? (
          <EmptyBudgetState
            title="No monthly budgets yet"
            description="Create a draft for the month you want to plan. You can add categories and tune allocations before approving."
            action={
              <CreateBudgetButton />
            }
          />
        ) : null}

        {!isLoading && !isError && budgets && budgets.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">
              All months
            </h2>
            <BudgetList
              budgets={budgets}
              currency={currency}
              locale={undefined}
            />
          </section>
        ) : null}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          className="w-[min(calc(100vw-2rem),22rem)]"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>New monthly budget</DialogTitle>
            <DialogDescription>
              One budget per household per calendar month. Starts as a draft until you
              approve.
            </DialogDescription>
          </DialogHeader>
          {activeHouseholdId ? (
            <CreateBudgetForm householdId={activeHouseholdId} />
          ) : null}
        </DialogContent>
      </Dialog>
    </BudgetPermissionGate>
  );
}
