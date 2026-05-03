"use client";

import { RoleBadge } from "@/features/household/components/RoleBadge";
import type { MemberRow } from "@/features/household/types";

export function MembersTable({ members }: { members: MemberRow[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[1.375rem] border border-border/90 bg-card shadow-soft md:block">
        <table className="w-full border-collapse text-[0.9375rem]">
          <thead className="border-b border-border/80 bg-muted/45 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.id}
                className="border-b border-border/55 last:border-0 transition-colors hover:bg-muted/[0.22]"
              >
                <td className="px-4 py-4 align-top">
                  <div className="font-semibold tracking-tight">
                    {m.users?.full_name ?? "—"}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {m.status === "invited" ? "Invited" : "Active member"}
                  </div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <RoleBadge role={m.role} />
                </td>
                <td className="px-4 py-4 align-middle capitalize text-muted-foreground">
                  {m.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" aria-label="Members">
        {members.map((m) => (
          <li
            key={m.id}
            className="rounded-2xl border border-border/90 bg-card px-4 py-4 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-semibold tracking-tight">
                  {m.users?.full_name ?? "—"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  {m.status === "invited" ? "Invited" : "Active"} ·{" "}
                  <span className="capitalize">{m.status}</span>
                </p>
              </div>
              <RoleBadge role={m.role} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
