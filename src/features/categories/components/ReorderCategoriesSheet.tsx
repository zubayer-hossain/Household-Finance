"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReorderHouseholdCategoriesMutation } from "@/features/categories/hooks/use-reorder-household-categories-mutation";
import type { HouseholdCategoryRow } from "@/features/categories/types";
import { cn } from "@/lib/utils";

export function ReorderCategoriesSheet({
  open,
  onOpenChange,
  householdId,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  categories: HouseholdCategoryRow[];
}) {
  const active = useMemo(
    () => categories.filter((c) => !c.archived_at),
    [categories]
  );
  const [order, setOrder] = useState<string[]>([]);
  const reorderMut = useReorderHouseholdCategoriesMutation(householdId);

  const activeIdsKey = useMemo(() => active.map((c) => c.id).join(","), [active]);

  useEffect(() => {
    if (!open) return;
    setOrder(active.map((c) => c.id));
  }, [open, activeIdsKey, active]);

  const byId = useMemo(() => new Map(active.map((c) => [c.id, c])), [active]);

  function move(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const i = prev.indexOf(id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const t = next[i]!;
      next[i] = next[j]!;
      next[j] = t;
      return next;
    });
  }

  async function save() {
    await reorderMut.mutateAsync({
      householdId,
      orderedCategoryIds: order,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(calc(100vw-2rem),24rem)] gap-4">
        <DialogHeader>
          <DialogTitle>Reorder categories</DialogTitle>
          <DialogDescription>
            Order here is copied into new monthly budgets. Existing months are unchanged.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex max-h-[min(60vh,24rem)] flex-col gap-2 overflow-y-auto">
          {order.map((id) => {
            const row = byId.get(id);
            if (!row) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5"
              >
                <span className="min-w-0 flex-1 text-sm font-medium">{row.name}</span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn("size-9 rounded-lg")}
                    aria-label="Move up"
                    disabled={order.indexOf(id) === 0 || reorderMut.isPending}
                    onClick={() => move(id, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9 rounded-lg"
                    aria-label="Move down"
                    disabled={
                      order.indexOf(id) === order.length - 1 || reorderMut.isPending
                    }
                    onClick={() => move(id, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        {reorderMut.isError ? (
          <p className="text-sm font-medium text-destructive">
            {reorderMut.error instanceof Error
              ? reorderMut.error.message
              : "Could not save order"}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={reorderMut.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={reorderMut.isPending || order.length === 0}
            onClick={() => void save()}
          >
            {reorderMut.isPending ? "Saving…" : "Save order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
