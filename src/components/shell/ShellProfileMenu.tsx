"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, House, LogOut } from "lucide-react";

import type { User } from "@supabase/supabase-js";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { HouseholdMembership } from "@/features/household/types";
import { useAppShellStore } from "@/stores/use-app-shell-store";
import { cn } from "@/lib/utils";

export type ShellProfileRow = {
  full_name?: string | null;
  avatar_url?: string | null;
} | null;

function initialsForAccount(
  fullName?: string | null,
  email?: string | null
): string {
  const name = fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2)
      return (
        parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)
      ).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const e = email?.trim();
  if (e) return e.slice(0, 2).toUpperCase();
  return "?";
}

export function ShellProfileMenu({
  user,
  profile,
  memberships,
  onSignOut,
  className,
}: {
  user: User | null;
  profile: ShellProfileRow;
  memberships: HouseholdMembership[];
  onSignOut: () => void | Promise<void>;
  className?: string;
}) {
  const email = user?.email ?? "";
  const displayName = profile?.full_name?.trim() || "Account";
  const activeHouseholdId = useAppShellStore((s) => s.activeHouseholdId);
  const setActiveMembership = useAppShellStore((s) => s.setActiveMembership);

  const active = memberships.find((m) => m.householdId === activeHouseholdId);
  const householdName = active?.household.name ?? "Household";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-full outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
          aria-label="Account menu"
        >
          <Avatar className="size-10 shadow-soft sm:size-11">
            {profile?.avatar_url ? (
              <AvatarImage
                src={profile.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback delayMs={120}>
              {initialsForAccount(profile?.full_name, email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "z-[100] min-w-[15rem] max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border/80 bg-card p-2 shadow-[0_12px_48px_-12px_hsl(223_43%_10%/0.28)] backdrop-blur-md"
          )}
          sideOffset={8}
          align="end"
          collisionPadding={16}
        >
          <div className="px-3 py-3">
            <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">
              {displayName}
            </p>
            {email ? (
              <p className="mt-1 truncate text-xs leading-snug text-muted-foreground">
                {email}
              </p>
            ) : null}
          </div>

          {memberships.length > 0 ? (
            <>
              <DropdownMenu.Separator className="-mx-0.5 my-1 h-px bg-border" />
              <div className="px-3 pb-2 pt-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <House
                    className="size-[0.875rem] text-primary/80 opacity-85"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  Household
                </p>
                <p className="mt-2 truncate text-[13px] font-semibold tracking-tight text-foreground">
                  {householdName}
                </p>
                {memberships.length === 1 ? (
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    Your only workspace — switching isn&apos;t needed.
                  </p>
                ) : null}
                {memberships.length > 1 ? (
                  <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                    Choose another workspace below.
                  </p>
                ) : null}
              </div>
              {memberships.length > 1 ? (
                <div className="pb-1">
                  {memberships.map((m) => {
                    const selected = m.householdId === activeHouseholdId;
                    return (
                      <DropdownMenu.Item
                        key={m.householdId}
                        disabled={selected}
                        className={cn(
                          "flex cursor-pointer items-start gap-2 rounded-xl px-3 py-[0.65rem] text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-muted/90 data-[highlighted]:text-foreground",
                          selected &&
                            "bg-primary/[0.06] data-[highlighted]:bg-primary/[0.08]"
                        )}
                        onSelect={() => {
                          setActiveMembership(m.householdId, m.role ?? null);
                        }}
                      >
                        <span className="flex w-5 shrink-0 justify-center pt-px text-muted-foreground">
                          {selected ? (
                            <Check
                              className="size-4 text-primary"
                              aria-hidden
                            />
                          ) : (
                            <span
                              className="inline-block size-4"
                              aria-hidden
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold tracking-tight">
                            {m.household.name}
                          </span>
                          <span className="text-[11px] capitalize leading-tight text-muted-foreground">
                            {m.role}
                          </span>
                        </span>
                      </DropdownMenu.Item>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : null}

          <DropdownMenu.Separator className="-mx-0.5 my-1 h-px bg-border" />
          <DropdownMenu.Item
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-[0.65rem] text-sm font-semibold outline-none",
              "text-destructive focus:bg-destructive/10 focus:text-destructive"
            )}
            onSelect={(e) => {
              e.preventDefault();
              void onSignOut();
            }}
          >
            <LogOut className="size-4 shrink-0 opacity-80" aria-hidden />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
