"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authService } from "@/features/auth/services/auth.service";
import { getSupabaseBrowser } from "@/services/supabase-client";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function SessionListener() {
  const setAuth = useAppShellStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  useEffect(() => {
    const sub = authService.onAuthChange(async (_event, session) => {
      setAuth(session, session?.user ?? null);
      await queryClient.invalidateQueries();
    });

    void getSupabaseBrowser().auth.getSession().then(({ data }) => {
      setAuth(data.session ?? null, data.session?.user ?? null, true);
    });

    return () => sub.unsubscribe();
  }, [setAuth, queryClient]);

  return null;
}
