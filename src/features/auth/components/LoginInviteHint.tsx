"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { FormCallout } from "@/components/ui/form-callout";

function LoginInviteHintInner() {
  const sp = useSearchParams();
  const reason = sp.get("reason");
  const detail = sp.get("detail") ?? sp.get("message");

  if (reason !== "oauth" || detail) return null;

  return (
    <FormCallout tone="neutral" className="mb-4 text-left leading-relaxed">
      <span className="font-medium text-foreground">Were you invited?</span> Your invitation is a{" "}
      <strong className="font-semibold text-foreground">magic link</strong>, not a password yet. Tap
      the button in that email — you should arrive already signed into your household. If you see
      this screen instead, go back and use the invite link again, or ask the admin to send a fresh
      invite.
    </FormCallout>
  );
}

export function LoginInviteHint() {
  return (
    <Suspense fallback={null}>
      <LoginInviteHintInner />
    </Suspense>
  );
}
