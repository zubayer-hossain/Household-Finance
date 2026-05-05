import { getSupabaseBrowser } from "@/services/supabase-client";

export async function finalizePendingHouseholdInvites(): Promise<void> {
  const supabase = getSupabaseBrowser();
  const finalize = await supabase.rpc("finalize_pending_household_invites");
  if (finalize.error && process.env.NODE_ENV === "development") {
    console.warn(
      "[finalizePendingHouseholdInvites] finalize_pending_household_invites:",
      finalize.error.message
    );
  }
}
