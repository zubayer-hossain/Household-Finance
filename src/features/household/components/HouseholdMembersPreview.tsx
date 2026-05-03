"use client";



import Link from "next/link";



import { ChevronRight } from "lucide-react";



import { PermissionGate } from "@/features/household/components/PermissionGate";

import { RoleBadge } from "@/features/household/components/RoleBadge";

import type { MemberRow } from "@/features/household/types";



export function HouseholdMembersPreview({ members }: { members: MemberRow[] }) {

  const active = members.filter((m) => m.status !== "removed").slice(0, 4);



  return (

    <section className="rounded-[1.375rem] border border-border/90 bg-card p-6 shadow-soft">

      <div className="mb-5 flex items-center justify-between gap-3">

        <h3 className="text-[0.9375rem] font-semibold tracking-tight text-foreground">

          Members

        </h3>

        <PermissionGate need="canViewMembers">

          <Link

            href="/app/household/members"

            className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"

          >

            View all

            <ChevronRight className="size-3.5 opacity-80" aria-hidden />

          </Link>

        </PermissionGate>

      </div>

      <ul className="flex flex-col gap-3">

        {active.map((m) => (

          <li

            key={m.id}

            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/35 px-3 py-3 min-[420px]:flex-nowrap"

          >

            <div className="min-w-0 flex-1">

              <p className="truncate text-[0.9375rem] font-semibold tracking-tight">

                {m.users?.full_name ?? "Member"}

              </p>

              <p className="mt-0.5 text-[11px] font-medium capitalize leading-tight text-muted-foreground">

                {m.status}

              </p>

            </div>

            <RoleBadge role={m.role} />

          </li>

        ))}

      </ul>

      {!active.length ? (

        <p className="rounded-2xl border border-dashed border-border/90 bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">

          No members yet.

        </p>

      ) : null}

    </section>

  );

}

