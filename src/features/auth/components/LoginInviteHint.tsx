"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { FormCallout } from "@/components/ui/form-callout";

function LoginInviteHintInner() {
  const sp = useSearchParams();
  const reason = sp.get("reason");
  const detail = sp.get("detail") ?? sp.get("message");

  if (reason === "invite" && detail) {
    return (
      <FormCallout tone="neutral" className="mb-4 text-left leading-relaxed">
        {detail}
      </FormCallout>
    );
  }

  if (reason === "recovery" && detail) {
    return (
      <FormCallout tone="neutral" className="mb-4 text-left leading-relaxed">
        {detail}
      </FormCallout>
    );
  }

  if (reason !== "oauth" || detail) return null;

  return (
    <FormCallout tone="neutral" className="mb-4 text-left leading-relaxed">
      <span className="font-medium text-foreground">Were you invited?</span> Use the button in your
      invitation email — you will land on a short screen to{" "}
      <strong className="font-semibold text-foreground">create your password</strong>, then enter the
      app. If you signed out before saving a password, open the invite again or ask a household admin to
      resend it from <span className="font-medium text-foreground">Members</span> (Resend email on your
      pending row).
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
