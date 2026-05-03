import { getSupabaseBrowser } from "@/services/supabase-client";
import type { MemberRow } from "@/features/household/types";
import type { InviteMemberSchema } from "@/features/household/schemas/household.schemas";

export const membershipService = {
  async listMembers(householdId: string): Promise<MemberRow[]> {
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
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof body.error === "string" ? body.error : "Invitation failed"
      );
    }

    return { ok: true };
  },
};
