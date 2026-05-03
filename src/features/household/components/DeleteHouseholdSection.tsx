"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useHouseholdDeletionAssessment } from "@/features/household/hooks/use-household-deletion-assessment";
import { householdService } from "@/features/household/services/household.service";
import { qk } from "@/lib/query-keys";

import { cn } from "@/lib/utils";

export function DeleteHouseholdSection({
  householdId,
  householdName,
  isOwner,
  presentation = "banner",
}: {
  householdId: string;
  householdName: string;
  isOwner: boolean;
  presentation?: "banner" | "compact";
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: assessment,
    isLoading,
    isError,
    error,
    refetch,
  } = useHouseholdDeletionAssessment(isOwner ? householdId : null);

  if (!isOwner) return null;

  const typedOk = typed.trim().toLowerCase() === "delete";

  async function executeDelete() {
    setActionError(null);
    if (!typedOk) return;
    setBusy(true);
    try {
      await householdService.deleteHousehold(householdId);
      await queryClient.invalidateQueries({ queryKey: qk.householdMemberships });
      window.location.assign("/app/household");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const compact = presentation === "compact";

  return (
    <section
      className={cn(
        compact
          ? "border-t border-border/75 pt-4"
          : "rounded-[1.375rem] border border-destructive/25 bg-destructive/[0.06] px-5 py-5"
      )}
    >
      {!compact ? (
        <>
          <h2 className="text-[0.9375rem] font-semibold tracking-tight text-destructive">
            Delete household
          </h2>
          <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            This removes the household permanently for everyone. You can delete only when
            it’s safe — we verify members and recorded activity first.
          </p>
        </>
      ) : (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-destructive">
              Delete workspace
            </p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              Permanent. Only when no one else and no financial records remain.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className={cn("w-full rounded-xl", compact ? "mt-1 h-12" : "mt-4 h-16")} />
      ) : isError ? (
        <div
          className={cn(
            "rounded-xl border border-destructive/30 bg-background/85 px-4 py-4",
            compact ? "mt-1" : "mt-4"
          )}
        >
          <p className="text-sm leading-relaxed text-destructive">
            {error instanceof Error ? error.message : "Could not check whether delete is safe."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-xl"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      ) : assessment && !assessment.allowed ? (
        <div
          className={cn(
            "rounded-xl border border-destructive/30 bg-background/85 px-4 py-4",
            compact ? "mt-1" : "mt-4"
          )}
        >
          <p
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-[12px]" : "text-sm"
            )}
          >
            Delete isn&apos;t available yet
          </p>
          <ul
            className={cn(
              "mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground",
              compact ? "text-[12px]" : "text-sm"
            )}
          >
            {assessment.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("rounded-xl", compact ? "mt-3 h-9 text-[12px]" : "mt-4")}
            onClick={() => void refetch()}
          >
            Recheck eligibility
          </Button>
        </div>
      ) : assessment?.allowed ? (
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setTyped("");
              setActionError(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              variant={compact ? "outline" : "destructive"}
              className={cn(
                "rounded-xl",
                compact
                  ? "mt-3 w-full border-destructive/40 text-destructive hover:bg-destructive/[0.08] sm:w-auto sm:mt-1"
                  : "mt-5"
              )}
              size={compact ? "sm" : "default"}
            >
              {compact ? "Delete household" : "Delete this household"}
            </Button>
          </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            className="border-destructive/30"
          >
            <DialogTitle className="text-destructive pr-6">
              Delete &ldquo;{householdName}&rdquo;?
            </DialogTitle>
            <DialogDescription>
              This cannot be undone and removes <span className="font-semibold text-foreground">&ldquo;
              {householdName}&rdquo;</span> for everyone. Type the word{" "}
              <span className="font-mono font-semibold text-foreground">delete</span> below to confirm.
            </DialogDescription>

            <div className="mt-4 space-y-2.5">
              <Label htmlFor="hh-delete-confirm">Type delete to confirm</Label>
              <Input
                id="hh-delete-confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="delete"
                autoComplete="off"
                className="border-destructive/25"
              />
            </div>

            {actionError ? (
              <p className="mt-3 rounded-xl border border-destructive/35 bg-destructive/[0.08] px-3 py-2 text-sm whitespace-pre-line text-destructive">
                {actionError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                disabled={!typedOk || busy}
                onClick={() => void executeDelete()}
              >
                {busy ? "Deleting…" : "Permanently delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  );
}
