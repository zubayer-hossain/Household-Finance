import { getSupabaseBrowser } from "@/services/supabase-client";
import type { MemberRow } from "@/features/household/types";
import type {
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  UpdatePendingInviteNameSchema,
} from "@/features/household/schemas/household.schemas";

function inviteApiErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Invitation failed.";
  const err = (body as { error?: unknown }).error;
  if (typeof err === "string" && err.length > 0) return err;
  if (err && typeof err === "object") {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  return "Invitation failed.";
}

async function listMembersViaRest(
  householdId: string
): Promise<MemberRow[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("household_members")
    .select(
      `
          id,
          user_id,
          role,
          status,
          joined_at,
          users ( id, full_name, avatar_url, preferred_language )
        `
    )
    .eq("household_id", householdId);

  if (error) throw error;
  return (data ?? []) as unknown as MemberRow[];
}

export const membershipService = {
  async listMembers(householdId: string): Promise<MemberRow[]> {
    const supabase = getSupabaseBrowser();

    const { data, error } = await supabase.rpc("list_household_member_roster", {
      p_household_id: householdId,
    });

    if (!error && data != null) {
      const rows = data as unknown;
      if (Array.isArray(rows)) {
        return rows as MemberRow[];
      }
    }

    return listMembersViaRest(householdId);
  },

  async updateMemberRole(
    householdId: string,
    membershipId: string,
    role: UpdateMemberRoleSchema["role"]
  ): Promise<void> {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("household_members")
      .update({ role })
      .eq("id", membershipId)
      .eq("household_id", householdId);
    if (error) throw error;
  },

  async removeMember(householdId: string, membershipId: string): Promise<void> {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("household_members")
      .delete()
      .eq("id", membershipId)
      .eq("household_id", householdId);
    if (error) throw error;
  },

  async inviteMember(
    householdId: string,
    input: InviteMemberSchema
  ): Promise<{ ok: true } | never> {
    const res = await fetch("/api/household/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        householdId,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        ...(input.fullName?.trim()
          ? { fullName: input.fullName.trim() }
          : {}),
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(inviteApiErrorMessage(body));
    }

    return { ok: true };
  },

  async resendInviteEmail(input: {
    householdId: string;
    membershipId: string;
  }): Promise<{ ok: true } | never> {
    const res = await fetch("/api/household/resend-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(inviteApiErrorMessage(body));
    }
    return { ok: true };
  },

  async updatePendingInviteDisplayName(
    input: UpdatePendingInviteNameSchema
  ): Promise<{ ok: true } | never> {
    const res = await fetch("/api/household/update-invited-name", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof body.error === "string" ? body.error : "Could not update invitation name"
      );
    }
    return { ok: true };
  },
};
