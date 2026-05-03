"use client";

import { useState } from "react";

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
import { evaluateDraftBudgetDeleteEligibility } from "@/features/categories/services/draft-budget.service";
import type { MonthlyBudgetRow } from "@/features/budgets/types";
import { monthLabel } from "@/features/budgets/lib/budget-selectors";

export const DRAFT_BUDGET_DELETE_CONFIRM_PHRASE = "DELETE";

export function DeleteDraftBudgetDialog({
  open,
  onOpenChange,
  budget,
  transactionCount,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: MonthlyBudgetRow | null;
  transactionCount: number;
  pending: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [phrase, setPhrase] = useState("");

  const eligibility = evaluateDraftBudgetDeleteEligibility(
    budget ?? undefined,
    transactionCount
  );

  const phraseOk =
    phrase.trim() === DRAFT_BUDGET_DELETE_CONFIRM_PHRASE && eligibility.canDelete;

  function close() {
    setPhrase("");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setPhrase("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="w-[min(calc(100vw-2rem),24rem)] gap-4">
        <DialogHeader>
          <DialogTitle>Delete draft budget</DialogTitle>
          <DialogDescription>
            {budget
              ? `${monthLabel(budget.year, budget.month)} — this only removes the draft and its empty category shell.`
              : "Remove an accidental draft that has no expenses logged yet."}
          </DialogDescription>
        </DialogHeader>

        {!eligibility.canDelete ? (
          <p className="rounded-xl border border-border/80 bg-muted/50 px-3 py-2.5 text-sm font-medium text-muted-foreground">
            {eligibility.reason ?? "This budget cannot be deleted."}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Type{" "}
              <span className="font-mono font-semibold text-foreground">
                {DRAFT_BUDGET_DELETE_CONFIRM_PHRASE}
              </span>{" "}
              to confirm. This cannot be undone.
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="draft-del-confirm">Confirmation</Label>
              <Input
                id="draft-del-confirm"
                className="min-h-11 rounded-xl font-mono"
                autoComplete="off"
                disabled={pending}
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder={DRAFT_BUDGET_DELETE_CONFIRM_PHRASE}
              />
            </div>
          </>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={pending}
            onClick={close}
          >
            {eligibility.canDelete ? "Cancel" : "Close"}
          </Button>
          {eligibility.canDelete ? (
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={!phraseOk || pending}
              onClick={() => void Promise.resolve(onConfirm()).then(() => close())}
            >
              {pending ? "Deleting…" : "Delete draft"}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
