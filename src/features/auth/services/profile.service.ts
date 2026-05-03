import { getSupabaseBrowser } from "@/services/supabase-client";

export const profileService = {
  async getMyProfile() {
    const supabase = getSupabaseBrowser();
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return null;

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, avatar_url, preferred_language, created_at")
      .eq("id", uid)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
