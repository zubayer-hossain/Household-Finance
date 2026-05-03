"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetAdjustmentSheet } from "@/features/budgets/components/BudgetAdjustmentSheet";
import { BudgetApprovalDialog } from "@/features/budgets/components/BudgetApprovalDialog";
import { BudgetCategoryGrid } from "@/features/budgets/components/BudgetCategoryGrid";
import { BudgetPermissionGate } from "@/features/budgets/components/BudgetPermissionGate";
import { BudgetReallocationSheet } from "@/features/budgets/components/BudgetReallocationSheet";
import { BudgetSummaryCard } from "@/features/budgets/components/BudgetSummaryCard";
import { EmptyBudgetState } from "@/features/budgets/components/EmptyBudgetState";
import { MonthlyCloseDialog } from "@/features/budgets/components/MonthlyCloseDialog";
import { useBudgetCategoriesQuery } from "@/features/budgets/hooks/use-budget-categories-query";
import { useBudgetQuery } from "@/features/budgets/hooks/use-budget-query";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";
import { useHouseholdCapabilities } from "@/features/household/hooks/use-household-capabilities";
import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function BudgetsRouteDetail() {
  const params = useParams();
  const budgetId =
    typeof params.budgetId === "string"
      ? params.budgetId
      : params.budgetId?.[0] ?? null;

  const activeHouseholdId = useAppShellStore((s) => s.activeHouseholdId);
  const caps = useHouseholdCapabilities();

  const setReallocationOpen = useBudgetUiStore((s) => s.setReallocationOpen);
  const setApproveOpen = useBudgetUiStore((s) => s.setApproveDialogOpen);
  const setCloseOpen = useBudgetUiStore((s) => s.setMonthlyCloseDialogOpen);

  const { data: memberships } = useHouseholdMembershipsQuery(true);

  const activeHousehold = memberships?.find(
    (m) => m.householdId === activeHouseholdId
  );
  const currency = activeHousehold?.household.base_currency ?? "USD";

  const {
    data: budget,
    isLoading: budgetLoading,
    isFetched: budgetFetched,
    isError: budgetError,
    error: budgetErr,
  } = useBudgetQuery({
    budgetId,
    householdId: activeHouseholdId,
    enabled: Boolean(budgetId && activeHouseholdId),
  });

  const { data: categories, isLoading: catLoading } = useBudgetCategoriesQuery(
    budgetId,
    Boolean(budgetId)
  );

  const list = categories ?? [];

  const mismatchedHouse =
    Boolean(budget) &&
    Boolean(activeHouseholdId) &&
    budget!.household_id !== activeHouseholdId;

  const notFound = budgetFetched && (!budget || mismatchedHouse);

  const readOnlyPlanning = budget?.status === "closed";
  const canElevatedUi = Boolean(caps?.canApproveBudget) && !readOnlyPlanning;

  const loadingBlocks = budgetLoading || catLoading;

  if (!budgetId) {
    return (
      <p className="text-sm text-muted-foreground">Missing budget id.</p>
    );
  }

  return (
    <BudgetPermissionGate
      need="canViewBudgets"
      fallback={
        <p className="text-sm font-medium text-muted-foreground">
          You do not have access to budgets.
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <nav>
          <Link
            href="/app/budgets"
            className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl px-1 text-[0.9375rem] font-semibold text-primary hover:bg-primary/10"
          >
            <ChevronLeft className="size-4" aria-hidden />
            All budgets
          </Link>
        </nav>

        {loadingBlocks ? (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full rounded-[1.375rem]" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : null}

        {budgetError ? (
          <p className="text-sm font-medium text-destructive">
            {budgetErr instanceof Error ? budgetErr.message : "Could not load budget"}
          </p>
        ) : null}

        {notFound && !budgetLoading ? (
          <EmptyBudgetState
            title="Budget not found"
            description="That budget might belong to another household or was removed. Jump back and pick another month."
            action={
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/app/budgets">Back to budgets</Link>
              </Button>
            }
          />
        ) : null}

        {budget && activeHouseholdId && !notFound ? (
          <>
            <BudgetSummaryCard
              budget={budget}
              currency={currency}
              locale={undefined}
            />

            <BudgetPermissionGate need="canApproveBudget" fallback={null}>
              {budget.status !== "closed" ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto sm:flex-1"
                    disabled={!canElevatedUi || list.length < 2}
                    onClick={() => setReallocationOpen(true)}
                  >
                    Reallocate
                  </Button>
                  {budget.status === "draft" ? (
                    <Button
                      type="button"
                      className="w-full sm:flex-1"
                      disabled={!canElevatedUi}
                      onClick={() => setApproveOpen(true)}
                    >
                      Approve budget
                    </Button>
                  ) : null}
                  {budget.status === "active" ? (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:flex-1"
                      disabled={!canElevatedUi}
                      onClick={() => setCloseOpen(true)}
                    >
                      Close month
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </BudgetPermissionGate>

            {list.length === 0 ? (
              <EmptyBudgetState
                title="No categories yet"
                description="Add your first envelopes so allocations, health badges, and progress bars render here."
              />
            ) : null}

            <BudgetCategoryGrid
              householdId={activeHouseholdId}
              monthlyBudget={budget}
              currency={currency}
              locale={undefined}
              categories={list}
            />

            <BudgetAdjustmentSheet
              householdId={activeHouseholdId}
              monthlyBudgetId={budget.id}
              categories={list}
              currency={currency}
              locale={undefined}
            />
            <BudgetReallocationSheet
              householdId={activeHouseholdId}
              monthlyBudgetId={budget.id}
              categories={list}
            />
            <BudgetApprovalDialog
              householdId={activeHouseholdId}
              budgetId={budget.id}
            />
            <MonthlyCloseDialog
              householdId={activeHouseholdId}
              budgetId={budget.id}
            />
          </>
        ) : null}
      </div>
    </BudgetPermissionGate>
  );
}
