"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  ConfirmDestructiveDialog,
} from "@/components/ui/confirm-destructive-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { RoleBadge } from "@/features/household/components/RoleBadge";
import { membershipService } from "@/features/household/services/membership.service";
import type { UpdateMemberRoleSchema } from "@/features/household/schemas/household.schemas";
import type { HouseholdRole, MemberRow } from "@/features/household/types";
import { resolveHouseholdCapabilities } from "@/features/household/types";
import { qk } from "@/lib/query-keys";

const MANAGE_ROLES: readonly UpdateMemberRoleSchema["role"][] = [
  "admin",
  "contributor",
  "viewer",
];

function sortMembers(rows: MemberRow[]): MemberRow[] {
  const statusRank = (s: MemberRow["status"]) =>
    s === "active" ? 0 : s === "invited" ? 1 : 2;
  const roleRank = (r: HouseholdRole) =>
    r === "owner" ? 0 : r === "admin" ? 1 : r === "contributor" ? 2 : 3;
  return [...rows].sort((a, b) => {
    const d = statusRank(a.status) - statusRank(b.status);
    if (d !== 0) return d;
    const dr = roleRank(a.role) - roleRank(b.role);
    if (dr !== 0) return dr;
    return (a.users?.full_name ?? "").localeCompare(b.users?.full_name ?? "");
  });
}

function memberVisibilityStatus(m: MemberRow): string {
  if (m.status === "invited") {
    return "Invitation pending";
  }
  if (m.status === "active") {
    return "Active member";
  }
  return m.status;
}

export function MembersTable({
  householdId,
  members,
  viewerUserId,
  viewerRole,
}: {
  householdId: string;
  members: MemberRow[];
  viewerUserId: string | null;
  viewerRole: HouseholdRole | null;
}) {
  const queryClient = useQueryClient();
  const caps = resolveHouseholdCapabilities(viewerRole);
  const roster = sortMembers(members.filter((m) => m.status !== "removed"));

  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
  const [nameInviteTarget, setNameInviteTarget] = useState<MemberRow | null>(null);
  const [inviteNameDraft, setInviteNameDraft] = useState("");

  useEffect(() => {
    if (nameInviteTarget) {
      setInviteNameDraft(nameInviteTarget.users?.full_name?.trim() ?? "");
    } else {
      setInviteNameDraft("");
    }
  }, [nameInviteTarget]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: qk.members(householdId) });
  }

  async function onRoleChange(
    row: MemberRow,
    next: UpdateMemberRoleSchema["role"]
  ) {
    if (next === row.role) return;
    setErrMsg(null);
    setBusyRow(row.id);
    try {
      await membershipService.updateMemberRole(householdId, row.id, next);
      await refresh();
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Could not update role");
    } finally {
      setBusyRow(null);
    }
  }

  async function onResendInvite(row: MemberRow) {
    setErrMsg(null);
    setBusyRow(row.id);
    try {
      await membershipService.resendInviteEmail({
        householdId,
        membershipId: row.id,
      });
      await refresh();
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Could not resend invitation email");
    } finally {
      setBusyRow(null);
    }
  }

  async function saveInviteDisplayName() {
    if (!nameInviteTarget || !inviteNameDraft.trim()) return;
    const trimmed = inviteNameDraft.trim();
    setErrMsg(null);
    setBusyRow(nameInviteTarget.id);
    try {
      await membershipService.updatePendingInviteDisplayName({
        householdId,
        membershipId: nameInviteTarget.id,
        fullName: trimmed,
      });
      setNameInviteTarget(null);
      await refresh();
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Could not update name");
    } finally {
      setBusyRow(null);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setErrMsg(null);
    setBusyRow(removeTarget.id);
    try {
      await membershipService.removeMember(householdId, removeTarget.id);
      setRemoveTarget(null);
      await refresh();
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : "Could not remove member");
    } finally {
      setBusyRow(null);
    }
  }

  const displayName = (m: MemberRow) => {
    if (m.users?.full_name?.trim()) return m.users.full_name.trim();
    if (m.status === "invited") return "Pending invitation";
    return "Member";
  };

  const canEditRow = (row: MemberRow) =>
    caps.canInviteMember &&
    row.role !== "owner" &&
    row.user_id !== viewerUserId;

  const canRemoveRow = (row: MemberRow) => {
    if (!caps.canInviteMember) return false;
    if (row.role === "owner") return false;
    return true;
  };

  const canEditInviteDisplayName = (row: MemberRow) =>
    row.status === "invited" && canEditRow(row);

  const canResendInviteEmail = (row: MemberRow) =>
    row.status === "invited" && canEditRow(row);

  const cancellingInvite = removeTarget?.status === "invited";
  const removalRequiredPhrase =
    removeTarget != null ? (cancellingInvite ? "cancel" : "remove") : "";
  if (!roster.length) {
    return (
      <div className="rounded-[1.375rem] border border-dashed border-border/90 bg-muted/35 px-6 py-10 text-center text-[0.9375rem] leading-relaxed text-muted-foreground">
        No people in this household yet. Send an invite below — pending invitations
        will appear here until the person joins.
      </div>
    );
  }

  return (
    <>
      {errMsg ? (
        <p className="rounded-xl border border-destructive/35 bg-destructive/[0.08] px-4 py-3 text-sm text-destructive">
          {errMsg}
        </p>
      ) : null}

      <div className="hidden min-w-0 overflow-hidden rounded-[1.375rem] border border-border/90 bg-card shadow-soft md:block">
        <table className="w-full table-fixed border-collapse text-[0.9375rem]">
          <colgroup>
            <col className="min-w-0" style={{ width: caps.canInviteMember ? "36%" : "40%" }} />
            <col style={{ width: caps.canInviteMember ? "24%" : "30%" }} />
            <col style={{ width: caps.canInviteMember ? "22%" : "30%" }} />
            {caps.canInviteMember ? <col style={{ width: "18%" }} /> : null}
          </colgroup>
          <thead className="border-b border-border/80 bg-muted/45 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              {caps.canInviteMember ? (
                <th className="px-4 py-3 text-end">Manage</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {roster.map((m) => (
              <tr
                key={m.id}
                className="border-b border-border/55 last:border-0 transition-colors hover:bg-muted/[0.22]"
              >
                <td className="min-w-0 px-4 py-4 align-top">
                  <div className="truncate font-semibold tracking-tight">
                    {displayName(m)}
                  </div>
                  <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground/90">
                    {m.user_id.slice(0, 8)}…
                  </div>
                </td>
                <td className="min-w-0 px-4 py-4 align-middle">
                  {canEditRow(m) ? (
                    <NativeSelect
                      className="w-full max-w-full rounded-xl border-border/80 py-2 text-[13px] font-medium"
                      disabled={busyRow === m.id}
                      value={m.role}
                      onChange={(e) =>
                        void onRoleChange(m, e.target.value as UpdateMemberRoleSchema["role"])
                      }
                    >
                      {MANAGE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </NativeSelect>
                  ) : (
                    <RoleBadge role={m.role} />
                  )}
                </td>
                <td className="min-w-0 px-4 py-4 align-middle text-muted-foreground">
                  <span className="line-clamp-2 leading-snug">
                    {memberVisibilityStatus(m)}
                  </span>
                </td>
                {caps.canInviteMember ? (
                  <td className="px-4 py-4 text-end align-middle">
                    <div className="flex flex-col items-end gap-2">
                      {canEditInviteDisplayName(m) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyRow === m.id}
                          className="max-w-full rounded-xl"
                          onClick={() => setNameInviteTarget(m)}
                        >
                          Edit name
                        </Button>
                      ) : null}
                      {canResendInviteEmail(m) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyRow === m.id}
                          className="max-w-full rounded-xl"
                          onClick={() => void onResendInvite(m)}
                        >
                          Resend email
                        </Button>
                      ) : null}
                      {canRemoveRow(m) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyRow === m.id}
                          title={
                            m.status === "invited"
                              ? "Cancel invitation — you will confirm in the next step"
                              : "Remove this member — confirmation required"
                          }
                          className="max-w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/[0.06]"
                          onClick={() => setRemoveTarget(m)}
                        >
                          {m.status === "invited" ? "Cancel invite" : "Remove"}
                        </Button>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" aria-label="Members">
        {roster.map((m) => (
          <li
            key={m.id}
            className="rounded-2xl border border-border/90 bg-card px-4 py-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9375rem] font-semibold tracking-tight">
                  {displayName(m)}
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  {memberVisibilityStatus(m)}
                </p>
              </div>
              {!canEditRow(m) ? <RoleBadge role={m.role} /> : null}
            </div>
            {canEditInviteDisplayName(m) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-xl"
                disabled={busyRow === m.id}
                onClick={() => setNameInviteTarget(m)}
              >
                Edit invitation name
              </Button>
            ) : null}
            {canResendInviteEmail(m) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-xl"
                disabled={busyRow === m.id}
                onClick={() => void onResendInvite(m)}
              >
                Resend invitation email
              </Button>
            ) : null}
            {canEditRow(m) ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <NativeSelect
                  className="min-w-[6.5rem] flex-1 rounded-xl border-border/80 py-2 text-[13px] font-medium"
                  disabled={busyRow === m.id}
                  value={m.role}
                  onChange={(e) =>
                    void onRoleChange(m, e.target.value as UpdateMemberRoleSchema["role"])
                  }
                  aria-label={`Role for ${displayName(m)}`}
                >
                  {MANAGE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </NativeSelect>
                {caps.canInviteMember && canRemoveRow(m) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyRow === m.id}
                    className="shrink-0 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/[0.06]"
                    aria-label={
                      m.status === "invited"
                        ? `Cancel invitation for ${displayName(m)}`
                        : `Remove ${displayName(m)} from household`
                    }
                    onClick={() => setRemoveTarget(m)}
                  >
                    {m.status === "invited" ? "Cancel invite" : "Remove"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <ConfirmDestructiveDialog
        open={removeTarget != null}
        onOpenChange={(o) => {
          if (!o) setRemoveTarget(null);
        }}
        title={
          cancellingInvite ? "Cancel invitation?" : "Remove household member?"
        }
        titleClassName="pr-6"
        contentClassName="gap-1 w-[min(calc(100vw-2rem),26rem)]"
        description={
          cancellingInvite ? (
            <>
              This revokes their invite link. They will no longer be able to join using that
              invitation — you can send a new invite later.
            </>
          ) : (
            <>
              This person loses access immediately. You can invite them again only by sending a new
              invitation.
            </>
          )
        }
        confirmationPhrase={removalRequiredPhrase}
        phraseInputId="member-remove-confirm"
        confirmLabel={
          cancellingInvite ? "Cancel invitation" : "Remove member"
        }
        pendingConfirmLabel="Working…"
        pending={
          busyRow != null &&
          removeTarget != null &&
          busyRow === removeTarget.id
        }
        cancelLabel="Go back"
        onConfirm={confirmRemove}
      />

      <Dialog
        open={nameInviteTarget != null}
        onOpenChange={(o) => {
          if (!o) setNameInviteTarget(null);
        }}
      >
        <DialogContent className="w-[min(calc(100vw-2rem),24rem)] gap-5">
          <DialogTitle>Edit invitation name</DialogTitle>
          <DialogDescription id="invite-name-edit-desc">
            This appears in everyone&apos;s member list until they finish joining. It updates both
            their Supabase auth profile stub and household roster entry.
          </DialogDescription>
          <div className="space-y-2.5">
            <Label htmlFor="invite-display-name-edit">Displayed name</Label>
            <Input
              id="invite-display-name-edit"
              aria-describedby="invite-name-edit-desc"
              autoComplete="name"
              value={inviteNameDraft}
              onChange={(e) => setInviteNameDraft(e.target.value)}
              placeholder="Their name"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              disabled={busyRow !== null}
              onClick={() => setNameInviteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={
                busyRow !== null ||
                inviteNameDraft.trim().length === 0
              }
              onClick={() => void saveInviteDisplayName()}
            >
              {busyRow === nameInviteTarget?.id ? "Saving…" : "Save name"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
