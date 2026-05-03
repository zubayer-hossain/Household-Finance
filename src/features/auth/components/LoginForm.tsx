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
import { loginSchema, type LoginSchema } from "@/features/auth/schemas/auth.schemas";
import { authService } from "@/features/auth/services/auth.service";

export function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginSchema) {
    setFormError(null);
    try {
      await authService.signInWithEmail(values);
      window.location.assign("/app");
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Sign in failed");
    }
  }

  return (
    <Card className="w-full max-w-md border-input/85 shadow-soft">
      <CardHeader>
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
          Sign in
        </h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          Welcome back to your household workspace.
        </p>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-5">
          {formError ? (
            <FormCallout tone="destructive">{formError}</FormCallout>
          ) : null}
          <div className="space-y-2.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
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
          <div className="space-y-2.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs font-medium leading-relaxed text-destructive">
                {form.formState.errors.password.message}
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
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-[0.9375rem] text-muted-foreground">
            New here?{" "}
            <Link className="link-inline" href="/signup">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
