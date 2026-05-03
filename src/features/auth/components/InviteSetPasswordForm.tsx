"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { FormCallout } from "@/components/ui/form-callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inviteSetPasswordSchema,
  type InviteSetPasswordSchema,
} from "@/features/auth/schemas/auth.schemas";
import { authService } from "@/features/auth/services/auth.service";
import { householdService } from "@/features/household/services/household.service";

export function InviteSetPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<InviteSetPasswordSchema>({
    resolver: zodResolver(inviteSetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: InviteSetPasswordSchema) {
    setFormError(null);
    try {
      await authService.completeInvitePassword(values.password);
      await householdService.finalizePendingHouseholdInvites();
      window.location.assign("/app");
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Could not save password");
    }
  }

  return (
    <Card className="w-full max-w-md border-input/85 shadow-soft">
      <CardHeader>
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
          Set your password
        </h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          Choose a password you will use to sign in after you leave. This completes your invitation.
        </p>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-5">
          {formError ? (
            <FormCallout tone="destructive">{formError}</FormCallout>
          ) : null}
          <div className="space-y-2.5">
            <Label htmlFor="invite-password">Password</Label>
            <Input
              id="invite-password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs font-medium leading-relaxed text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="invite-confirm">Confirm password</Label>
            <Input
              id="invite-confirm"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs font-medium leading-relaxed text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="pb-[1.5rem]">
          <Button
            type="submit"
            className="w-full rounded-2xl"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving…" : "Save and continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
