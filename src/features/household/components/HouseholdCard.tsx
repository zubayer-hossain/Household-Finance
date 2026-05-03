"use client";

import type { HouseholdRecord } from "@/features/household/types";

export function HouseholdCard({ household }: { household: HouseholdRecord }) {
  return (
    <article className="rounded-[1.375rem] border border-border/90 bg-card p-6 shadow-soft">
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">{household.name}</h2>
      <dl className="mt-5 grid gap-4 text-[0.9375rem]">
        <div className="flex items-baseline justify-between gap-6 border-b border-border/65 pb-3 last:border-0 last:pb-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Currency
          </dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {household.base_currency}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-6 border-b border-border/65 pb-3 last:border-0 last:pb-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Timezone
          </dt>
          <dd className="truncate text-end font-semibold tracking-tight text-foreground">
            {household.timezone}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-6 pb-3 last:pb-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Slug
          </dt>
          <dd className="max-w-[12rem] truncate text-end font-mono text-[0.8125rem] font-semibold tracking-tight text-muted-foreground">
            {household.slug}
          </dd>
        </div>
      </dl>
    </article>
  );
}
