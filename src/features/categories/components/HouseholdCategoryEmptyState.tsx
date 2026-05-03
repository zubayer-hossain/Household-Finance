"use client";

import { Tags } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HouseholdCategoryEmptyState({
  onAdd,
  canManage,
}: {
  onAdd: () => void;
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/90 bg-muted/30 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Tags className="size-7" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="text-[1.0625rem] font-semibold tracking-tight text-foreground">
          No household categories yet
        </p>
        <p className="max-w-[22rem] text-sm leading-relaxed text-muted-foreground">
          Define categories once here. New monthly budgets copy them automatically so you
          are not rebuilding the same list every month.
        </p>
      </div>
      {canManage ? (
        <Button type="button" size="lg" className="rounded-xl" onClick={onAdd}>
          Add category
        </Button>
      ) : null}
    </div>
  );
}
