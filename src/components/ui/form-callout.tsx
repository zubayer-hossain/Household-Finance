"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const tones = {
  destructive: "border-destructive/35 bg-destructive/[0.08] text-destructive",
  neutral: "border-border/90 bg-muted/70 text-foreground",
} as const;

export function FormCallout({
  tone,
  children,
  className,
  ...rest
}: {
  tone: keyof typeof tones;
} & Omit<HTMLAttributes<HTMLParagraphElement>, "tone">) {
  return (
    <p
      role={tone === "destructive" ? "alert" : undefined}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </p>
  );
}
