"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HouseholdCreatorForm } from "@/features/household/components/HouseholdCreatorForm";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function CreateHouseholdDialog({
  triggerLabel,
  variant = "default",
}: {
  triggerLabel?: string;
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const setActiveMembership = useAppShellStore((s) => s.setActiveMembership);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size="lg"
          className="rounded-xl px-5"
        >
          {triggerLabel ?? "New household"}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[min(calc(100vw-2rem),26rem)]"
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="pr-6">Create household</DialogTitle>
        <DialogDescription>
          You become the owner. Set up another workspace for a different home,
          project, or shared budget.
        </DialogDescription>
        <div className="mt-2">
          <HouseholdCreatorForm
            submitLabel="Create household"
            idleLabel="Create household"
            submittingLabel="Creating…"
            onSuccess={async (row) => {
              setActiveMembership(row.id, "owner");
              setOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
