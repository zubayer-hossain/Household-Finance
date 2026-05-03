"use client";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { BudgetCategoryRow } from "@/features/budgets/types";
import { monthLabel } from "@/features/budgets/lib/budget-selectors";
import { cn } from "@/lib/utils";

function monthOptions(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    out.push({
      value: `${y}-${String(m).padStart(2, "0")}`,
      label: monthLabel(y, m),
    });
  }
  return out;
}

export function TransactionFilters({
  year,
  month,
  categoryId,
  categories,
  onYearMonthChange,
  onCategoryChange,
  disabled,
  className,
}: {
  year: number;
  month: number;
  categoryId: string | null;
  categories: BudgetCategoryRow[];
  onYearMonthChange: (year: number, month: number) => void;
  onCategoryChange: (categoryId: string | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const ymValue = `${year}-${String(month).padStart(2, "0")}`;
  const opts = monthOptions();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end",
        className
      )}
    >
      <div className="grid min-w-[12rem] flex-1 gap-1.5">
        <Label htmlFor="tx-filter-month" className="text-[13px] font-semibold">
          Month
        </Label>
        <NativeSelect
          id="tx-filter-month"
          disabled={disabled}
          value={ymValue}
          onChange={(e) => {
            const [ys, ms] = e.target.value.split("-");
            onYearMonthChange(Number(ys), Number(ms));
          }}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid min-w-[12rem] flex-1 gap-1.5">
        <Label htmlFor="tx-filter-cat" className="text-[13px] font-semibold">
          Category
        </Label>
        <NativeSelect
          id="tx-filter-cat"
          disabled={disabled}
          value={categoryId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onCategoryChange(v === "" ? null : v);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
