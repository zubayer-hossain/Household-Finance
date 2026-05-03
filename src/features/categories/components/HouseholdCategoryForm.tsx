"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  createHouseholdCategorySchema,
  updateHouseholdCategorySchema,
  type CreateHouseholdCategorySchema,
  type UpdateHouseholdCategorySchema,
} from "@/features/categories/schemas/category.schemas";

type Props = {
  mode: "create" | "edit";
  householdId: string;
  categoryId?: string;
  defaultValues: {
    name: string;
    categoryType: "fixed" | "variable";
    defaultAmount: number;
  };
  onSubmit: (
    values: CreateHouseholdCategorySchema | UpdateHouseholdCategorySchema
  ) => void | Promise<void>;
  pending: boolean;
  onCancel: () => void;
};

export function HouseholdCategoryForm(props: Props) {
  if (props.mode === "create") {
    return (
      <CreateHouseholdCategoryFormInner
        householdId={props.householdId}
        defaultValues={props.defaultValues}
        onSubmit={props.onSubmit}
        pending={props.pending}
        onCancel={props.onCancel}
      />
    );
  }
  return (
    <EditHouseholdCategoryFormInner
      householdId={props.householdId}
      categoryId={props.categoryId!}
      defaultValues={props.defaultValues}
      onSubmit={props.onSubmit}
      pending={props.pending}
      onCancel={props.onCancel}
    />
  );
}

function CreateHouseholdCategoryFormInner({
  householdId,
  defaultValues,
  onSubmit,
  pending,
  onCancel,
}: Omit<Props, "mode" | "categoryId"> & { mode?: "create" }) {
  const form = useForm<CreateHouseholdCategorySchema>({
    resolver: zodResolver(createHouseholdCategorySchema),
    defaultValues: {
      householdId,
      name: defaultValues.name,
      categoryType: defaultValues.categoryType,
      defaultAmount: defaultValues.defaultAmount,
    },
  });

  useEffect(() => {
    form.reset({
      householdId,
      name: defaultValues.name,
      categoryType: defaultValues.categoryType,
      defaultAmount: defaultValues.defaultAmount,
    });
  }, [householdId, defaultValues, form]);

  return (
    <CategoryFields
      form={form as never}
      includeCategoryIdHidden={false}
      pending={pending}
      onCancel={onCancel}
      submitLabel={pending ? "Saving…" : "Create"}
      onValidSubmit={() => void onSubmit(form.getValues())}
    />
  );
}

function EditHouseholdCategoryFormInner({
  householdId,
  categoryId,
  defaultValues,
  onSubmit,
  pending,
  onCancel,
}: Omit<Props, "mode"> & { categoryId: string }) {
  const form = useForm<UpdateHouseholdCategorySchema>({
    resolver: zodResolver(updateHouseholdCategorySchema),
    defaultValues: {
      householdId,
      categoryId,
      name: defaultValues.name,
      categoryType: defaultValues.categoryType,
      defaultAmount: defaultValues.defaultAmount,
    },
  });

  useEffect(() => {
    form.reset({
      householdId,
      categoryId,
      name: defaultValues.name,
      categoryType: defaultValues.categoryType,
      defaultAmount: defaultValues.defaultAmount,
    });
  }, [householdId, categoryId, defaultValues, form]);

  return (
    <CategoryFields
      form={form as never}
      includeCategoryIdHidden
      pending={pending}
      onCancel={onCancel}
      submitLabel={pending ? "Saving…" : "Save changes"}
      onValidSubmit={() => void onSubmit(form.getValues())}
    />
  );
}

function CategoryFields({
  form,
  includeCategoryIdHidden,
  pending,
  onCancel,
  submitLabel,
  onValidSubmit,
}: {
  form: {
    register: ReturnType<typeof useForm>["register"];
    handleSubmit: ReturnType<typeof useForm>["handleSubmit"];
    formState: { errors: Record<string, { message?: string } | undefined> };
  };
  includeCategoryIdHidden?: boolean;
  pending: boolean;
  onCancel: () => void;
  submitLabel: string;
  onValidSubmit: () => void;
}) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onValidSubmit)}
      noValidate
    >
      <div className="grid gap-1.5">
        <Label htmlFor="hc-name">Name</Label>
        <Input
          id="hc-name"
          className="min-h-11 rounded-xl"
          disabled={pending}
          {...form.register("name")}
        />
        {form.formState.errors.name?.message ? (
          <p className="text-xs font-medium text-destructive">
            {String(form.formState.errors.name.message)}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="hc-type">Type</Label>
        <NativeSelect
          id="hc-type"
          disabled={pending}
          {...form.register("categoryType")}
        >
          <option value="fixed">Fixed</option>
          <option value="variable">Variable</option>
        </NativeSelect>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="hc-amt">Default monthly amount</Label>
        <Input
          id="hc-amt"
          inputMode="decimal"
          className="min-h-11 rounded-xl tabular-nums"
          disabled={pending}
          {...form.register("defaultAmount", { valueAsNumber: true })}
        />
        <p className="text-[11px] text-muted-foreground">
          Copied into new budgets as planned and adjusted. You can still change amounts per
          month.
        </p>
        {form.formState.errors.defaultAmount?.message ? (
          <p className="text-xs font-medium text-destructive">
            {String(form.formState.errors.defaultAmount.message)}
          </p>
        ) : null}
      </div>

      <input type="hidden" {...form.register("householdId")} />
      {includeCategoryIdHidden ? (
        <input type="hidden" {...form.register("categoryId" as never)} />
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
