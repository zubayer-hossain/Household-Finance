"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { budgetService } from "@/features/budgets/services/budget.service";
import { useBudgetsQuery } from "@/features/budgets/hooks/use-budgets-query";
import { useHouseholdCapabilities } from "@/features/household/hooks/use-household-capabilities";
import { DeleteTransactionDialog } from "@/features/transactions/components/DeleteTransactionDialog";
import { TransactionEmptyState } from "@/features/transactions/components/TransactionEmptyState";
import { TransactionFilters } from "@/features/transactions/components/TransactionFilters";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { TransactionPermissionGate } from "@/features/transactions/components/TransactionPermissionGate";
import { useDeleteTransactionMutation } from "@/features/transactions/hooks/use-delete-transaction-mutation";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { transactionService } from "@/features/transactions/services/transaction.service";
import { useTransactionUiStore } from "@/features/transactions/stores/use-transaction-ui-store";
import { qk } from "@/lib/query-keys";
import { useAppShellStore } from "@/stores/use-app-shell-store";
import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";

const CreateTransactionSheet = dynamic(
  () =>
    import("@/features/transactions/components/CreateTransactionSheet").then(
      (m) => m.CreateTransactionSheet
    ),
  { ssr: false }
);

const EditTransactionSheet = dynamic(
  () =>
    import("@/features/transactions/components/EditTransactionSheet").then(
      (m) => m.EditTransactionSheet
    ),
  { ssr: false }
);

const TransactionDetailSheet = dynamic(
  () =>
    import("@/features/transactions/components/TransactionDetailSheet").then(
      (m) => m.TransactionDetailSheet
    ),
  { ssr: false }
);

export function TransactionsRoute() {
  const user = useAppShellStore((s) => s.user);
  const householdId = useAppShellStore((s) => s.activeHouseholdId);
  const caps = useHouseholdCapabilities();
  const filters = useTransactionUiStore((s) => s.filters);
  const setFilters = useTransactionUiStore((s) => s.setFilters);
  const detailId = useTransactionUiStore((s) => s.detailTransactionId);
  const setDetailId = useTransactionUiStore((s) => s.setDetailTransactionId);
  const createOpen = useTransactionUiStore((s) => s.createSheetOpen);
  const setCreateOpen = useTransactionUiStore((s) => s.setCreateSheetOpen);
  const editId = useTransactionUiStore((s) => s.editTransactionId);
  const setEditId = useTransactionUiStore((s) => s.setEditTransactionId);

  const { data: memberships } = useHouseholdMembershipsQuery(true);
  const activeHousehold = memberships?.find(
    (m) => m.householdId === householdId
  );
  const currency = activeHousehold?.household.base_currency ?? "USD";

  const { data: budgets, isLoading: budgetsLoading } =
    useBudgetsQuery(householdId);

  const monthlyBudget = useMemo(
    () =>
      budgets?.find(
        (b) => b.year === filters.year && b.month === filters.month
      ) ?? null,
    [budgets, filters.year, filters.month]
  );

  const categoriesQuery = useQuery({
    queryKey: qk.budgetCategories(monthlyBudget?.id ?? "—"),
    queryFn: () => budgetService.listCategories(monthlyBudget!.id),
    enabled: Boolean(monthlyBudget?.id),
    staleTime: 60_000,
  });

  const categories = categoriesQuery.data ?? [];

  const transactionsQuery = useTransactionsQuery(
    householdId,
    monthlyBudget?.id ?? null,
    filters.categoryId,
    Boolean(monthlyBudget?.id)
  );

  const editFetch = useQuery({
    queryKey: qk.transaction(editId ?? "—"),
    queryFn: () =>
      editId && householdId
        ? transactionService.getTransaction(editId, householdId)
        : null,
    enabled: Boolean(editId && householdId),
    staleTime: 5_000,
  });

  const editTransaction =
    transactionsQuery.data?.find((t) => t.id === editId) ??
    editFetch.data ??
    null;

  const readOnlyMonth = monthlyBudget?.status === "closed";

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteMut = useDeleteTransactionMutation(householdId);

  const deleteTargetRow =
    transactionsQuery.data?.find((t) => t.id === deleteTargetId) ?? null;

  async function confirmDelete() {
    if (!deleteTargetId || !householdId || !deleteTargetRow) return;
    await deleteMut.mutateAsync({
      transactionId: deleteTargetId,
      householdId,
      monthlyBudgetId: deleteTargetRow.monthly_budget_id,
    });
    setDeleteOpen(false);
    setDeleteTargetId(null);
    setDetailId(null);
  }

  return (
    <TransactionPermissionGate
      need="canViewTransactions"
      fallback={
        <p className="text-sm font-medium text-muted-foreground">
          You do not have access to transactions.
        </p>
      }
    >
      <div className="flex flex-col gap-6 pb-10 md:pb-10">
        <header className="space-y-2">
          <p className="eyebrow">Spending</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
                Transactions
              </h1>
              <p className="mt-1 max-w-[36rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
                Log expenses fast. Filter by month or category. Closed months are read-only.
              </p>
            </div>
            <TransactionPermissionGate need="canCreateTransaction" fallback={null}>
              <Button
                type="button"
                size="lg"
                className="rounded-xl"
                onClick={() => setCreateOpen(true)}
                disabled={readOnlyMonth || !monthlyBudget || categories.length === 0}
              >
                <Plus className="mr-2 size-4" aria-hidden />
                Add expense
              </Button>
            </TransactionPermissionGate>
          </div>
        </header>

        <TransactionFilters
          year={filters.year}
          month={filters.month}
          categoryId={filters.categoryId}
          categories={categories}
          disabled={categoriesQuery.isLoading}
          onYearMonthChange={(y, m) => setFilters({ year: y, month: m })}
          onCategoryChange={(id) => setFilters({ categoryId: id })}
        />

        {readOnlyMonth ? (
          <p className="rounded-2xl border border-border/80 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            This month is closed — viewing only.
          </p>
        ) : null}

        {budgetsLoading || categoriesQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : null}

        {!monthlyBudget ? (
          <TransactionEmptyState
            title="No budget for this month"
            description="Create a monthly budget first, then categories will appear here for logging expenses."
          />
        ) : transactionsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : (transactionsQuery.data?.length ?? 0) === 0 ? (
          <TransactionEmptyState
            title="No expenses yet"
            description="Use Add expense above to record your first expense for this month."
          />
        ) : (
          <TransactionList
            transactions={transactionsQuery.data ?? []}
            currency={currency}
            locale={undefined}
            onOpenDetail={(id) => setDetailId(id)}
          />
        )}

        <CreateTransactionSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          householdId={householdId}
          monthlyBudgetId={monthlyBudget?.id ?? null}
          categories={categories}
          readOnly={readOnlyMonth || !monthlyBudget}
          actorUserId={user?.id ?? null}
        />

        <EditTransactionSheet
          open={Boolean(editId)}
          onOpenChange={(o) => {
            if (!o) setEditId(null);
          }}
          householdId={householdId}
          monthlyBudgetId={monthlyBudget?.id ?? null}
          categories={categories}
          transaction={editTransaction}
          readOnly={readOnlyMonth || !monthlyBudget}
        />

        <TransactionDetailSheet
          open={Boolean(detailId)}
          onOpenChange={(o) => {
            if (!o) setDetailId(null);
          }}
          transactionId={detailId}
          householdId={householdId}
          currency={currency}
          locale={undefined}
          caps={caps}
          readOnlyMonth={readOnlyMonth}
          onEdit={(id) => {
            setEditId(id);
          }}
          onDelete={(id) => {
            setDeleteTargetId(id);
            setDeleteOpen(true);
          }}
        />

        <DeleteTransactionDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          pending={deleteMut.isPending}
          onConfirm={confirmDelete}
        />
      </div>
    </TransactionPermissionGate>
  );
}
