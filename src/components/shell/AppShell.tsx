"use client";

import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/shell/AppHeader";
import { MobileBottomNav } from "@/components/shell/MobileBottomNav";
import type { HouseholdMembership } from "@/features/household/types";

export function AppShell({
  memberships,
  children,
}: {
  memberships: HouseholdMembership[];
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-gradient-to-b from-background via-background to-muted/[0.45] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_120%_90%_at_50%_-20%,hsl(221_71%_45%/0.07),transparent)]"
        aria-hidden
      />
      <AppHeader memberships={memberships} />
      <main className="relative z-0 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-6 sm:px-6 md:pt-8 md:pb-2">
        <div className="flex flex-1 flex-col gap-6">{children}</div>
      </main>
      <Separator className="relative z-10 hidden bg-border/75 md:block md:max-w-xl md:mx-auto" />
      <MobileBottomNav />
    </div>
  );
}
