"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function HouseholdCategoryLifecycleDialog({
  open,
  onOpenChange,
  action,
  categoryName,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "archive" | "restore" | null;
  categoryName: string;
  pending: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const isArchive = action === "archive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(calc(100vw-2rem),24rem)] gap-4">
        <DialogHeader>
          <DialogTitle>
            {isArchive ? "Archive this category?" : "Restore this category?"}
          </DialogTitle>
          <DialogDescription>
            {isArchive
              ? `“${categoryName}” will be hidden from new monthly budget prefills. Existing months stay the same. Turn on “Show archived” to restore it later.`
              : `“${categoryName}” will be included again when you create new monthly budgets.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isArchive ? "destructive" : "default"}
            className="rounded-xl"
            disabled={pending || !action}
            onClick={() => void Promise.resolve(onConfirm()).then(() => onOpenChange(false))}
          >
            {pending
              ? isArchive
                ? "Archiving…"
                : "Restoring…"
              : isArchive
                ? "Archive category"
                : "Restore category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
