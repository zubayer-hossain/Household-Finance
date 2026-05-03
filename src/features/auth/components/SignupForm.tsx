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
import { NativeSelect } from "@/components/ui/native-select";
import { authService } from "@/features/auth/services/auth.service";
import { signupSchema, type SignupSchema } from "@/features/auth/schemas/auth.schemas";

export function SignupForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      preferredLanguage: "en",
    },
  });

  async function onSubmit(values: SignupSchema) {
    setFormError(null);
    setInfo(null);
    try {
      const { session } = await authService.signUp(values);
      if (session) {
        window.location.assign("/onboarding");
        return;
      }
      setInfo(
        "Check your email to confirm your account, then return to sign in."
      );
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Sign up failed");
    }
  }

  return (
    <Card className="w-full max-w-md border-input/85 shadow-soft">
      <CardHeader>
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
          Create account
        </h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          Set up your profile; you will create your first household next.
        </p>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-5">
          {formError ? (
            <FormCallout tone="destructive">{formError}</FormCallout>
          ) : null}
          {info ? <FormCallout tone="neutral">{info}</FormCallout> : null}
          <div className="space-y-2.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
            {form.formState.errors.fullName ? (
              <p className="text-xs font-medium leading-relaxed text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            ) : null}
          </div>
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
            <Label htmlFor="lang">Preferred language</Label>
            <NativeSelect id="lang" {...form.register("preferredLanguage")}>
              <option value="en">English</option>
              <option value="bn">Bengali</option>
            </NativeSelect>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-[1.5rem]">
          <Button
            type="submit"
            className="w-full rounded-2xl"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Creating…" : "Sign up"}
          </Button>
          <p className="text-center text-[0.9375rem] text-muted-foreground">
            Already have an account?{" "}
            <Link className="link-inline" href="/login">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
