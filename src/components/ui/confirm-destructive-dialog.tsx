"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ConfirmDestructivePhrasePanelProps = {
  /** Opens/closes the surrounding `<Dialog>`; phrase input resets when this becomes false. */
  dialogActive: boolean;
  title: ReactNode;
  description?: ReactNode;
  /** Comparison is `trim().toLowerCase()` (same as phrase shown to the typist). */
  confirmationPhrase: string;
  phraseInputId: string;
  /** Shown beside the monospace phrase in the label. Default: "to confirm". */
  phrasePurpose?: string;
  confirmLabel: string;
  pendingConfirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  /** Extra disable besides phrase mismatch (row-level busy ids, etc.). */
  confirmDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  mismatchHint?: string;
  errorMessage?: string | null;
  contentClassName?: string;
  titleClassName?: string;
};

/**
 * Inner panel for destructive flows: wraps `DialogContent` and requires typing `confirmationPhrase`.
 * Compose with `<Dialog>` + optional `<DialogTrigger>` when trigger lives outside this file.
 */
export function ConfirmDestructivePhrasePanel({
  dialogActive,
  title,
  description,
  confirmationPhrase,
  phraseInputId,
  phrasePurpose = "to confirm.",
  confirmLabel,
  pendingConfirmLabel = "Working…",
  cancelLabel = "Cancel",
  pending = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  mismatchHint = "Phrase must match exactly (letters only, case insensitive).",
  errorMessage,
  contentClassName,
  titleClassName,
}: ConfirmDestructivePhrasePanelProps) {
  const normalized = confirmationPhrase.trim().toLowerCase();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!dialogActive) setTyped("");
  }, [dialogActive]);

  const typedOk = typed.trim().toLowerCase() === normalized && normalized !== "";

  return (
    <DialogContent
      aria-describedby={undefined}
      className={cn("border-destructive/25", contentClassName)}
    >
      <DialogTitle
        className={cn(
          "pr-6 font-semibold tracking-tight text-destructive",
          titleClassName
        )}
      >
        {title}
      </DialogTitle>
      {description ? (
        <DialogDescription className="mt-3">{description}</DialogDescription>
      ) : null}

      <div className="mt-6 space-y-3">
        <Label
          htmlFor={phraseInputId}
          className="text-[0.8125rem] font-semibold tracking-tight text-foreground"
        >
          Type{" "}
          <span className="font-mono text-[0.875em] text-destructive">
            {confirmationPhrase.trim()}
          </span>{" "}
          {phrasePurpose}
        </Label>
        <Input
          id={phraseInputId}
          name="confirm-destructive-phrase"
          autoComplete="off"
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmationPhrase.trim()}
          className="font-mono"
          aria-invalid={typed.length > 0 && !typedOk}
          disabled={pending}
        />
        {typed.length > 0 && !typedOk ? (
          <p className="text-xs text-muted-foreground">{mismatchHint}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-xl border border-destructive/35 bg-destructive/[0.08] px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="rounded-xl"
          disabled={pending}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="rounded-xl"
          disabled={!typedOk || pending || confirmDisabled}
          onClick={() => void onConfirm()}
        >
          {pending ? pendingConfirmLabel : confirmLabel}
        </Button>
      </div>
    </DialogContent>
  );
}

export type ConfirmDestructiveDialogProps = Omit<
  ConfirmDestructivePhrasePanelProps,
  "dialogActive" | "onCancel"
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Fully controlled destructive dialog wrapper (no built-in trigger). */
export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  ...panel
}: ConfirmDestructiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ConfirmDestructivePhrasePanel
        {...panel}
        dialogActive={open}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}
