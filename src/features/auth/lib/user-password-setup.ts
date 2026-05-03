import type { User } from "@supabase/supabase-js";

export const INVITE_SET_PASSWORD_PATH = "/auth/invite/set-password";

export function userNeedsPasswordSet(user: User | null | undefined): boolean {
  if (!user?.user_metadata) return false;
  const v = user.user_metadata.needs_password;
  return v === true || v === "true";
}
