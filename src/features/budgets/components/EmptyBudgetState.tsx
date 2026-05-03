"use client";

import type { ReactNode } from "react";

import { PiggyBank } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyBudgetState({
  title,
  description,
  className,
  action,
}: {
  title: string;
  description: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-[1.375rem] border border-dashed border-border/90 bg-card/40 px-6 py-14 text-center shadow-soft",
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <PiggyBank className="size-7" strokeWidth={2} aria-hidden />
      </span>
      <div className="max-w-sm space-y-2">
        <p className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="w-full max-w-xs">{action}</div> : null}
    </div>
  );
}
