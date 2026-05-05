"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { FormCallout } from "@/components/ui/form-callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from "@/features/auth/schemas/auth.schemas";
import { authService } from "@/features/auth/services/auth.service";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordSchema) {
    setFormError(null);
    setSentTo(null);
    try {
      await authService.sendPasswordResetEmail(values);
      setSentTo(values.email);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Could not send reset email");
    }
  }

  return (
    <Card className="w-full max-w-md border-input/85 shadow-soft">
      <CardHeader>
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
          Forgot password
        </h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          Enter your email and we&apos;ll send a password reset link.
        </p>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-5">
          {formError ? <FormCallout tone="destructive">{formError}</FormCallout> : null}
          {sentTo ? (
            <FormCallout tone="neutral">
              If an account exists for <strong>{sentTo}</strong>, a reset link has been sent.
            </FormCallout>
          ) : null}
          <div className="space-y-2.5">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs font-medium leading-relaxed text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-[1.5rem]">
          <Button
            type="submit"
            className="w-full rounded-2xl"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-center text-[0.9375rem] text-muted-foreground">
            Remembered it?{" "}
            <Link className="link-inline" href="/login">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
