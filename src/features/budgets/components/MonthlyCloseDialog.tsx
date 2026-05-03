"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCloseMonthMutation } from "@/features/budgets/hooks/use-close-month-mutation";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";

export function MonthlyCloseDialog({
  householdId,
  budgetId,
}: {
  householdId: string;
  budgetId: string;
}) {
  const open = useBudgetUiStore((s) => s.monthlyCloseDialogOpen);
  const setOpen = useBudgetUiStore((s) => s.setMonthlyCloseDialogOpen);
  const mutation = useCloseMonthMutation(householdId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[min(calc(100vw-2rem),22rem)]"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Close month</DialogTitle>
          <DialogDescription>
            Locks this budget as read-only and closes the fiscal period for planning
            edits. Requires owner or admin.
          </DialogDescription>
        </DialogHeader>
        {mutation.isError ? (
          <p className="text-sm font-medium text-destructive">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Could not close month"}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setOpen(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={mutation.isPending}
            onClick={async () => {
              await mutation.mutateAsync(budgetId);
              setOpen(false);
            }}
          >
            {mutation.isPending ? "Closing…" : "Close month"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
