"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/90 bg-card p-8 text-center shadow-soft",
        className
      )}
    >
      {Icon ? (
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted/85 text-muted-foreground ring-1 ring-border/65">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {children ? (
        <div className="mt-6 flex flex-col items-center gap-2">{children}</div>
      ) : null}
    </section>
  );
}
