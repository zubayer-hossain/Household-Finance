"use client";

import type { BudgetCategoryRow } from "@/features/budgets/types";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export function TransactionCategorySelect({
  id,
  label = "Category",
  categories,
  value,
  onChange,
  disabled,
  className,
}: {
  id: string;
  label?: string;
  categories: BudgetCategoryRow[];
  value: string;
  onChange: (budgetCategoryId: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </Label>
      <NativeSelect
        id={id}
        disabled={disabled || categories.length === 0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {categories.length === 0 ? "No categories" : "Select category"}
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
