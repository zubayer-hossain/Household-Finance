"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowser } from "@/services/supabase-browser";

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value != null && EMAIL_OTP_TYPES.has(value);
}

function pickSafeNext(searchParams: URLSearchParams): string {
  const raw = searchParams.get("next");
  if (
    raw &&
    raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.includes(":")
  ) {
    return raw;
  }
  return "/app";
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = pickSafeNext(searchParams);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const authError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createSupabaseBrowser();

      if (authError) {
        const qs = new URLSearchParams({ reason: authError });
        if (errorDescription) qs.set("detail", errorDescription);
        router.replace(`/login?${qs.toString()}`);
        return;
      }

      const hashRaw =
        typeof window !== "undefined"
          ? window.location.hash.replace(/^#/, "")
          : "";
      if (hashRaw) {
        const hp = new URLSearchParams(hashRaw);
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            router.replace(
              `/login?reason=session&message=${encodeURIComponent(error.message)}`
            );
            return;
          }
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}${window.location.search}`
          );
          if (!cancelled) router.replace(next);
          return;
        }
      }

      if (tokenHash && isEmailOtpType(typeParam)) {
        const { error } = await supabase.auth.verifyOtp({
          type: typeParam,
          token_hash: tokenHash,
        });
        if (error) {
          router.replace(
            `/login?reason=verify&message=${encodeURIComponent(error.message)}`
          );
          return;
        }
        if (!cancelled) router.replace(next);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(
            `/login?reason=oauth&message=${encodeURIComponent(error.message)}`
          );
          return;
        }
        if (!cancelled) router.replace(next);
        return;
      }

      router.replace("/login?reason=oauth");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    router,
    next,
    code,
    tokenHash,
    typeParam,
    authError,
    errorDescription,
  ]);

  return (
    <div className="surface-market flex min-h-dvh items-center justify-center px-6 text-sm text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="surface-market flex min-h-dvh items-center justify-center px-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
