"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandBar } from "@/components/shell/BrandBar";
import { Skeleton } from "@/components/ui/skeleton";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export default function ResetPasswordPage() {
  const router = useRouter();
  const hydrated = useAppShellStore((s) => s.authHydrated);
  const user = useAppShellStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace(
        `/login?reason=recovery&message=${encodeURIComponent(
          "Your reset link is invalid or expired. Request a new reset email."
        )}`
      );
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="surface-market flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-14">
        <Skeleton className="h-14 w-[13rem] rounded-2xl" />
        <Skeleton className="h-44 w-full max-w-md rounded-3xl" />
        <p className="text-sm font-medium text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="surface-market flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-14">
        <Loader2 className="size-9 animate-spin text-primary/70" aria-hidden />
        <p className="text-sm font-medium text-muted-foreground">
          Redirecting to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className="surface-market min-h-dvh">
      <BrandBar />
      <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center gap-4 px-5 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-14">
        <ResetPasswordForm />
        <Link
          href="/login"
          className="text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
