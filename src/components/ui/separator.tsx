"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
  }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    role="presentation"
    className={cn(
      "bg-border",
      orientation === "horizontal" ? "h-px w-full shrink-0" : "w-px self-stretch",
      className
    )}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
