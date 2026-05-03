"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormCallout } from "@/components/ui/form-callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  inviteMemberSchema,
  type InviteMemberSchema,
} from "@/features/household/schemas/household.schemas";
import { membershipService } from "@/features/household/services/membership.service";
import { qk } from "@/lib/query-keys";

function InviteFields({
  form,
  err,
  msg,
  inputIdPrefix,
  submitLabel,
}: {
  form: ReturnType<typeof useForm<InviteMemberSchema>>;
  err: string | null;
  msg: string | null;
  inputIdPrefix: string;
  submitLabel: string;
}) {
  return (
    <>
      {err ? <FormCallout tone="destructive">{err}</FormCallout> : null}
      {msg ? <FormCallout tone="neutral">{msg}</FormCallout> : null}
      <div className="space-y-2.5">
        <Label htmlFor={`${inputIdPrefix}-email`}>Email</Label>
        <Input
          id={`${inputIdPrefix}-email`}
          type="email"
          autoComplete="off"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-xs font-medium leading-relaxed text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2.5">
        <Label htmlFor={`${inputIdPrefix}-name`}>Name (optional)</Label>
        <Input
          id={`${inputIdPrefix}-name`}
          type="text"
          autoComplete="name"
          placeholder="Shown in your member list"
          {...form.register("fullName")}
        />
        {form.formState.errors.fullName ? (
          <p className="text-xs font-medium leading-relaxed text-destructive">
            {form.formState.errors.fullName.message}
          </p>
        ) : (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Prefilled for brand-new invitees only. Existing users keep their account name until they
            change it in signup or profile.
          </p>
        )}
      </div>
      <div className="space-y-2.5">
        <Label htmlFor={`${inputIdPrefix}-role`}>Role</Label>
        <NativeSelect id={`${inputIdPrefix}-role`} {...form.register("role")}>
          <option value="contributor">Contributor</option>
          <option value="viewer">Viewer</option>
        </NativeSelect>
      </div>
      <Button
        type="submit"
        className="w-full rounded-xl"
        size="lg"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Sending…" : submitLabel}
      </Button>
    </>
  );
}

export function InviteMemberForm({
  householdId,
  layout = "card",
  onInvited,
}: {
  householdId: string;
  layout?: "card" | "plain";
  onInvited?: () => void;
}) {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const form = useForm<InviteMemberSchema>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "contributor", fullName: "" },
  });

  async function onSubmit(values: InviteMemberSchema) {
    setErr(null);
    setMsg(null);
    try {
      const fullName = values.fullName?.trim();
      await membershipService.inviteMember(householdId, {
        email: values.email,
        role: values.role,
        ...(fullName ? { fullName } : {}),
      });
      form.reset({ email: "", role: values.role, fullName: "" });
      setMsg("Invitation sent.");
      await queryClient.invalidateQueries({ queryKey: qk.members(householdId) });
      onInvited?.();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Invite failed");
    }
  }

  const prefix = layout === "plain" ? "invite-modal" : "invite";

  const fields = (
    <form
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <InviteFields
        form={form}
        err={err}
        msg={msg}
        inputIdPrefix={prefix}
        submitLabel="Send invite"
      />
    </form>
  );

  if (layout === "plain") {
    return (
      <div className="pt-1">
        {fields}
      </div>
    );
  }

  return (
    <Card className="border-input/85 shadow-soft">
      <CardHeader>
        <h2 className="text-lg font-semibold tracking-tight">Invite member</h2>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          They must use the same email in Supabase Auth. New users receive an invite
          email if your project supports it.
        </p>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-5">
          <InviteFields
            form={form}
            err={err}
            msg={msg}
            inputIdPrefix={prefix}
            submitLabel="Send invite"
          />
        </CardContent>
      </form>
    </Card>
  );
}

export function InviteMemberDialog({
  householdId,
  triggerButtonClassName,
}: {
  householdId: string;
  /** Applied to the Invite trigger; use for layout parity with paired header actions (e.g. equal width on mobile). */
  triggerButtonClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="default"
          className={cn(
            "inline-flex h-[2.875rem] min-h-[2.875rem] max-h-[2.875rem] shrink-0 gap-2 whitespace-nowrap px-3 py-0 text-[0.8125rem] shadow-soft sm:text-[0.9375rem]",
            triggerButtonClassName
          )}
        >
          <MailPlus className="size-[1.05rem] shrink-0 opacity-90 sm:size-[1.1rem]" aria-hidden />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[min(calc(100vw-2rem),24rem)]"
        aria-describedby="invite-modal-desc"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle>Invite someone</DialogTitle>
        <DialogDescription id="invite-modal-desc">
          They must sign in with this email. Add an optional name so your roster stays clear.
          Brand-new invitees inherit it in their profile until they edit it during signup / account.
        </DialogDescription>
        <InviteMemberForm
          householdId={householdId}
          layout="plain"
          onInvited={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
