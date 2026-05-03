"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; isActive: (pathname: string) => boolean };

const items: NavItem[] = [
  { href: "/app", label: "Home", isActive: (p) => p === "/app" },
  {
    href: "/app/transactions",
    label: "Expenses",
    isActive: (p) => p.startsWith("/app/transactions"),
  },
  {
    href: "/app/budgets",
    label: "Budgets",
    isActive: (p) => p.startsWith("/app/budgets"),
  },
  {
    href: "/app/household",
    label: "Household",
    isActive: (p) => p === "/app/household",
  },
  {
    href: "/app/household/members",
    label: "Members",
    isActive: (p) =>
      p === "/app/household/members" || p.startsWith("/app/household/members/"),
  },
];

/** Shown from `md` up; mobile uses [`MobileBottomNav`](./MobileBottomNav.tsx). */
export function AppDesktopNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-1", className)}
      aria-label="Primary navigation"
    >
      {items.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-xl px-3 py-2 text-[0.8125rem] font-semibold tracking-tight transition-[color,background-color]",
              active
                ? "bg-primary/11 text-primary"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
