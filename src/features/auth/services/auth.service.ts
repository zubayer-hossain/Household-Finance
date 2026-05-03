import { getSupabaseBrowser } from "@/services/supabase-client";
import type { LoginSchema, SignupSchema } from "@/features/auth/schemas/auth.schemas";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
export const authService = {
  async signInWithEmail(input: LoginSchema) {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(input: SignupSchema) {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          preferred_language: input.preferredLanguage,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthChange(
    listener: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>
  ) {    const supabase = getSupabaseBrowser();
    const { data } = supabase.auth.onAuthStateChange(listener);
    return data.subscription;
  },
};
