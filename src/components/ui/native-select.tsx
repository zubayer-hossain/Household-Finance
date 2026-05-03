"use client";

import * as React from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export const nativeSelectTailwind =
  "flex min-h-[2.875rem] w-full cursor-pointer appearance-none rounded-xl border border-border bg-card py-2.5 pl-4 pr-12 text-base text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 md:text-[0.9375rem]";

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative w-full">
    <select ref={ref} className={cn(nativeSelectTailwind, className)} {...props}>
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-muted-foreground opacity-65"
      aria-hidden
    />
  </div>
));
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
