"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormCallout } from "@/components/ui/form-callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createHouseholdSchema,
  type CreateHouseholdSchema,
} from "@/features/household/schemas/household.schemas";
import { householdService } from "@/features/household/services/household.service";
import type { HouseholdRecord } from "@/features/household/types";
import { qk } from "@/lib/query-keys";

type Props = {
  submitLabel: string;
  idleLabel?: string;
  submittingLabel?: string;
  onSuccess?: (row: HouseholdRecord) => void | Promise<void>;
  footer?: ReactNode;
  className?: string;
};

export function HouseholdCreatorForm({
  submitLabel,
  idleLabel = submitLabel,
  submittingLabel = "Creating…",
  onSuccess,
  footer,
  className,
}: Props) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CreateHouseholdSchema>({
    resolver: zodResolver(createHouseholdSchema),
    defaultValues: {
      name: "",
      baseCurrency: "BDT",
      timezone: "Asia/Dhaka",
    },
  });

  async function onSubmit(values: CreateHouseholdSchema) {
    setServerError(null);
    try {
      const row = await householdService.createHousehold(values);
      await queryClient.invalidateQueries({ queryKey: qk.householdMemberships });
      form.reset({ ...form.getValues(), name: "" });
      await onSuccess?.(row);
    } catch (e: unknown) {
      setServerError(
        e instanceof Error ? e.message : "Could not create household"
      );
    }
  }

  return (
    <form
      className={className}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {serverError ? (
        <FormCallout tone="destructive" className="mb-4">
          {serverError}
        </FormCallout>
      ) : null}
      <div className="flex flex-col gap-5">
        <div className="space-y-2.5">
          <Label htmlFor="hh-create-name">Household name</Label>
          <Input
            id="hh-create-name"
            placeholder="Home"
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p className="text-xs font-medium leading-relaxed text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <details className="group rounded-2xl border border-border bg-muted/55 px-4 py-[0.65rem] text-sm transition-colors open:bg-muted/[0.65] [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-3 font-semibold tracking-tight text-foreground outline-none">
            <span>Advanced (optional)</span>
            <ChevronDown
              className="size-[1rem] shrink-0 translate-y-px text-muted-foreground opacity-80 transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="space-y-4 border-border/85 pt-4">
            <div className="space-y-2.5">
              <Label htmlFor="hh-create-ccy">Currency</Label>
              <Input
                id="hh-create-ccy"
                maxLength={3}
                {...form.register("baseCurrency")}
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="hh-create-tz">Timezone</Label>
              <Input id="hh-create-tz" {...form.register("timezone")} />
            </div>
          </div>
        </details>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full rounded-xl"
          size="lg"
        >
          {form.formState.isSubmitting ? submittingLabel : idleLabel}
        </Button>
        {footer}
      </div>
    </form>
  );
}
