"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  renameHouseholdSchema,
  type RenameHouseholdSchema,
} from "@/features/household/schemas/household.schemas";
import { householdService } from "@/features/household/services/household.service";
import { qk } from "@/lib/query-keys";
import {
  resolveHouseholdCapabilities,
  type HouseholdRecord,
  type HouseholdRole,
} from "@/features/household/types";

export function RenameHouseholdSection({
  membershipRole,
  householdId,
  household,
}: {
  membershipRole: HouseholdRole;
  householdId: string;
  household: HouseholdRecord;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<RenameHouseholdSchema>({
    resolver: zodResolver(renameHouseholdSchema),
    values: { name: household.name },
  });

  const canManage =
    resolveHouseholdCapabilities(membershipRole).canManageHousehold;

  if (!canManage) return null;

  async function onSubmit(values: RenameHouseholdSchema) {
    setServerError(null);
    try {
      await householdService.updateHouseholdName(householdId, values.name);
      await queryClient.invalidateQueries({ queryKey: qk.householdMemberships });
      setOpen(false);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Could not rename");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/35 px-4 py-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Household name
        </p>
        <p className="mt-1 truncate text-[0.9375rem] font-semibold tracking-tight text-foreground">
          {household.name}
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl shrink-0">
            <Pencil className="size-[0.9375rem] opacity-75" aria-hidden />
            Rename
          </Button>
        </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogTitle className="pr-6">Rename household</DialogTitle>
            <DialogDescription>
              Visible to everyone in this workspace. Currency and timezone stay the same.
            </DialogDescription>
            <form
              className="mt-4 flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              {serverError ? (
                <p className="rounded-xl border border-destructive/35 bg-destructive/[0.08] px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              ) : null}
              <div className="space-y-2.5">
                <Label htmlFor="hh-rename-name">New name</Label>
                <Input id="hh-rename-name" autoComplete="off" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl">
                  {form.formState.isSubmitting ? "Saving…" : "Save name"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
