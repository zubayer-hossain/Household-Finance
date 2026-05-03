"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Home, LayoutGrid, PieChart, Receipt } from "lucide-react";

import { appShellContentClassName } from "@/components/shell/app-shell-content";
import { cn } from "@/lib/utils";

const navCls =
  "flex min-h-[2.875rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold transition-[color,transform,background-color] active:scale-[0.96] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring md:rounded-lg";

export function MobileBottomNav() {
  const pathname = usePathname();
  const homeActive = pathname === "/app";
  const txActive = pathname.startsWith("/app/transactions");
  const budgetsActive = pathname.startsWith("/app/budgets");
  const categoriesActive = pathname.startsWith("/app/categories");

  return (
    <nav
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Primary navigation"
    >
      <div className="pointer-events-auto pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div
          className={cn(
            appShellContentClassName,
            "grid grid-cols-4 gap-1 rounded-[1.375rem] border border-border/70 bg-card/92 p-2 shadow-[0_-8px_40px_-12px_hsl(223_43%_10%/0.16)] backdrop-blur-2xl"
          )}
        >
          <Link
            href="/app"
            prefetch
            aria-current={homeActive ? "page" : undefined}
            className={cn(navCls, homeActive ? "bg-primary/11 text-primary" : "text-muted-foreground")}
          >
            <Home className="size-[1.125rem]" strokeWidth={homeActive ? 2.25 : 2} aria-hidden />
            <span className="leading-none">Home</span>
          </Link>
          <Link
            href="/app/budgets"
            prefetch
            aria-current={budgetsActive ? "page" : undefined}
            className={cn(
              navCls,
              budgetsActive ? "bg-primary/11 text-primary" : "text-muted-foreground"
            )}
          >
            <PieChart
              className="size-[1.125rem]"
              strokeWidth={budgetsActive ? 2.25 : 2}
              aria-hidden
            />
            <span className="leading-none">Budgets</span>
          </Link>
          <Link
            href="/app/categories"
            prefetch
            aria-current={categoriesActive ? "page" : undefined}
            className={cn(
              navCls,
              categoriesActive ? "bg-primary/11 text-primary" : "text-muted-foreground"
            )}
          >
            <LayoutGrid
              className="size-[1.125rem]"
              strokeWidth={categoriesActive ? 2.25 : 2}
              aria-hidden
            />
            <span className="leading-none">Categories</span>
          </Link>
          <Link
            href="/app/transactions"
            prefetch
            aria-current={txActive ? "page" : undefined}
            className={cn(
              navCls,
              txActive ? "bg-primary/11 text-primary" : "text-muted-foreground"
            )}
          >
            <Receipt
              className="size-[1.125rem]"
              strokeWidth={txActive ? 2.25 : 2}
              aria-hidden
            />
            <span className="leading-none">Expenses</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
