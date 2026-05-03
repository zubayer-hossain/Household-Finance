"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CategoryPermissionGate } from "@/features/categories/components/CategoryPermissionGate";
import { HouseholdCategoryEmptyState } from "@/features/categories/components/HouseholdCategoryEmptyState";
import { HouseholdCategoryForm } from "@/features/categories/components/HouseholdCategoryForm";
import { HouseholdCategoryLifecycleDialog } from "@/features/categories/components/HouseholdCategoryLifecycleDialog";
import { HouseholdCategoryList } from "@/features/categories/components/HouseholdCategoryList";
import { ReorderCategoriesSheet } from "@/features/categories/components/ReorderCategoriesSheet";
import { useArchiveHouseholdCategoryMutation } from "@/features/categories/hooks/use-archive-household-category-mutation";
import { useUnarchiveHouseholdCategoryMutation } from "@/features/categories/hooks/use-unarchive-household-category-mutation";
import { useCreateHouseholdCategoryMutation } from "@/features/categories/hooks/use-create-household-category-mutation";
import { useHouseholdCategoriesQuery } from "@/features/categories/hooks/use-household-categories-query";
import { useUpdateHouseholdCategoryMutation } from "@/features/categories/hooks/use-update-household-category-mutation";
import { useCategoryUiStore } from "@/features/categories/stores/use-category-ui-store";
import type {
  CreateHouseholdCategorySchema,
  UpdateHouseholdCategorySchema,
} from "@/features/categories/schemas/category.schemas";
import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";
import { useHouseholdCapabilities } from "@/features/household/hooks/use-household-capabilities";
import { useAppShellStore } from "@/stores/use-app-shell-store";
import { useState } from "react";

import type { HouseholdCategoryRow } from "@/features/categories/types";

const EMPTY_CATEGORIES: HouseholdCategoryRow[] = [];

export function CategoriesRoute() {
  const householdId = useAppShellStore((s) => s.activeHouseholdId);
  const caps = useHouseholdCapabilities();
  const { data: memberships } = useHouseholdMembershipsQuery(true);
  const activeHousehold = memberships?.find((m) => m.householdId === householdId);
  const currency = activeHousehold?.household.base_currency ?? "USD";

  const [showArchived, setShowArchived] = useState(false);
  const createOpen = useCategoryUiStore((s) => s.createOpen);
  const setCreateOpen = useCategoryUiStore((s) => s.setCreateOpen);
  const editId = useCategoryUiStore((s) => s.editCategoryId);
  const setEditId = useCategoryUiStore((s) => s.setEditCategoryId);
  const reorderOpen = useCategoryUiStore((s) => s.reorderOpen);
  const setReorderOpen = useCategoryUiStore((s) => s.setReorderOpen);

  const listQuery = useHouseholdCategoriesQuery(householdId, {
    includeArchived: showArchived,
    enabled: Boolean(householdId),
  });

  const createMut = useCreateHouseholdCategoryMutation(householdId);
  const updateMut = useUpdateHouseholdCategoryMutation(householdId);
  const archiveMut = useArchiveHouseholdCategoryMutation(householdId);
  const unarchiveMut = useUnarchiveHouseholdCategoryMutation(householdId);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<
    | null
    | { action: "archive" | "restore"; row: HouseholdCategoryRow }
  >(null);

  const categories = listQuery.data ?? EMPTY_CATEGORIES;
  const activeForReorder = categories.filter((c) => !c.archived_at);

  const editing = editId ? categories.find((c) => c.id === editId) : null;

  const canView = Boolean(caps?.canViewCategories);
  const canManage = Boolean(caps?.canManageCategories);

  if (!canView) {
    return (
      <p className="text-sm font-medium text-muted-foreground">
        You do not have access to household categories.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="space-y-2">
        <p className="eyebrow">Household</p>
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
          Categories
        </h1>
        <p className="max-w-[32rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
          Templates used when you start a new monthly budget. Edits here apply to future
          budgets only — not months you have already planned.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryPermissionGate need="canManageCategories">
          <Button
            type="button"
            size="lg"
            className="rounded-xl"
            disabled={!householdId}
            onClick={() => setCreateOpen(true)}
          >
            Add category
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="rounded-xl"
            disabled={!householdId || activeForReorder.length < 2}
            onClick={() => setReorderOpen(true)}
          >
            Reorder
          </Button>
        </CategoryPermissionGate>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="rounded-xl text-muted-foreground"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
      </div>

      {listQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : null}

      {listQuery.isError ? (
        <p className="text-sm font-medium text-destructive">
          {listQuery.error instanceof Error
            ? listQuery.error.message
            : "Could not load categories"}
        </p>
      ) : null}

      {!listQuery.isLoading &&
      !listQuery.isError &&
      categories.filter((c) => !c.archived_at).length === 0 &&
      !showArchived ? (
        <HouseholdCategoryEmptyState
          canManage={canManage}
          onAdd={() => setCreateOpen(true)}
        />
      ) : null}

      {!listQuery.isLoading && !listQuery.isError && categories.length > 0 ? (
        <HouseholdCategoryList
          categories={categories}
          currency={currency}
          locale={undefined}
          canManage={canManage}
          onEdit={(row) => setEditId(row.id)}
          onArchive={(row) => setLifecycle({ action: "archive", row })}
          onRestore={(row) => setLifecycle({ action: "restore", row })}
          archivingId={archivingId}
          restoringId={restoringId}
        />
      ) : null}

      <HouseholdCategoryLifecycleDialog
        open={Boolean(lifecycle)}
        onOpenChange={(o) => !o && setLifecycle(null)}
        action={lifecycle?.action ?? null}
        categoryName={lifecycle?.row.name ?? ""}
        pending={
          lifecycle?.action === "archive"
            ? archiveMut.isPending
            : lifecycle?.action === "restore"
              ? unarchiveMut.isPending
              : false
        }
        onConfirm={async () => {
          if (!lifecycle) return;
          if (lifecycle.action === "archive") {
            setArchivingId(lifecycle.row.id);
            try {
              await archiveMut.mutateAsync(lifecycle.row.id);
            } finally {
              setArchivingId(null);
            }
          } else {
            setRestoringId(lifecycle.row.id);
            try {
              await unarchiveMut.mutateAsync(lifecycle.row.id);
            } finally {
              setRestoringId(null);
            }
          }
        }}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[min(calc(100vw-2rem),24rem)] gap-4">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Added to your household template list for future monthly budgets.
            </DialogDescription>
          </DialogHeader>
          {householdId ? (
            <HouseholdCategoryForm
              mode="create"
              householdId={householdId}
              defaultValues={{
                name: "",
                categoryType: "variable",
                defaultAmount: 0,
              }}
              pending={createMut.isPending}
              onCancel={() => setCreateOpen(false)}
              onSubmit={async (v) => {
                await createMut.mutateAsync(v as CreateHouseholdCategorySchema);
                setCreateOpen(false);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="w-[min(calc(100vw-2rem),24rem)] gap-4">
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>Updates apply to future budgets only.</DialogDescription>
          </DialogHeader>
          {householdId && editing ? (
            <HouseholdCategoryForm
              mode="edit"
              householdId={householdId}
              categoryId={editing.id}
              defaultValues={{
                name: editing.name,
                categoryType: editing.category_type,
                defaultAmount: editing.default_amount,
              }}
              pending={updateMut.isPending}
              onCancel={() => setEditId(null)}
              onSubmit={async (v) => {
                await updateMut.mutateAsync(v as UpdateHouseholdCategorySchema);
                setEditId(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {householdId ? (
        <ReorderCategoriesSheet
          open={reorderOpen}
          onOpenChange={setReorderOpen}
          householdId={householdId}
          categories={categories}
        />
      ) : null}
    </div>
  );
}
