let client: ReturnType<typeof createSupabaseSingleton> | null = null;

import { createSupabaseBrowser } from "@/services/supabase-browser";

function createSupabaseSingleton() {
  return createSupabaseBrowser();
}

export function getSupabaseBrowser() {
  client ??= createSupabaseSingleton();
  return client;
}
