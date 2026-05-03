"use client";

import type { ReactNode } from "react";

import { AppLogoLink } from "@/components/shell/AppLogoLink";
import { cn } from "@/lib/utils";

export function BrandBar({
  end,
  className,
}: {
  /** Optional trailing actions (compact). */
  end?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/55 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-4 px-5 sm:h-[3.625rem] sm:px-6">
        <AppLogoLink href="/" />
        {end}
      </div>
    </header>
  );
}
