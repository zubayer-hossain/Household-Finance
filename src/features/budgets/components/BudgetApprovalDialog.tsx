"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApproveBudgetMutation } from "@/features/budgets/hooks/use-approve-budget-mutation";
import { useBudgetUiStore } from "@/features/budgets/stores/use-budget-ui-store";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function BudgetApprovalDialog({
  householdId,
  budgetId,
}: {
  householdId: string;
  budgetId: string;
}) {
  const open = useBudgetUiStore((s) => s.approveDialogOpen);
  const setOpen = useBudgetUiStore((s) => s.setApproveDialogOpen);
  const userId = useAppShellStore((s) => s.user?.id);
  const mutation = useApproveBudgetMutation(householdId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[min(calc(100vw-2rem),22rem)]"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Approve budget</DialogTitle>
          <DialogDescription>
            Moves this monthly budget from <strong>Draft</strong> to{" "}
            <strong>Active</strong>. You can keep adjusting allocations afterward as
            an owner or admin.
          </DialogDescription>
        </DialogHeader>
        {mutation.isError ? (
          <p className="text-sm font-medium text-destructive">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Could not approve"}
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
            className="w-full sm:w-auto"
            disabled={mutation.isPending || !userId}
            onClick={async () => {
              if (!userId) return;
              await mutation.mutateAsync({ budgetId, actorUserId: userId });
              setOpen(false);
            }}
          >
            {mutation.isPending ? "Approving…" : "Approve budget"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
