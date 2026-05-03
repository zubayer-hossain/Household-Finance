"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { INVITE_SET_PASSWORD_PATH, userNeedsPasswordSet } from "@/features/auth/lib/user-password-setup";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAppShellStore((s) => s.authHydrated);
  const user = useAppShellStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (userNeedsPasswordSet(user)) {
      router.replace(INVITE_SET_PASSWORD_PATH);
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="surface-market flex min-h-dvh items-center justify-center p-10">
        <Skeleton className="h-48 w-full max-w-sm rounded-3xl shadow-soft" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="surface-market flex min-h-dvh flex-col items-center justify-center gap-5 p-10">
        <Skeleton className="h-48 w-full max-w-sm rounded-3xl shadow-soft" />
        <p className="text-sm font-medium text-muted-foreground">Redirecting to sign in…</p>
      </div>
    );
  }

  if (userNeedsPasswordSet(user)) {
    return (
      <div className="surface-market flex min-h-dvh flex-col items-center justify-center gap-5 p-10">
        <Skeleton className="h-48 w-full max-w-sm rounded-3xl shadow-soft" />
        <p className="text-sm font-medium text-muted-foreground">Finishing invitation setup…</p>
      </div>
    );
  }

  return <>{children}</>;
}
