"use client";



import { Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";

import type { ReactNode } from "react";

import { useEffect } from "react";



import { BrandBar } from "@/components/shell/BrandBar";

import { Skeleton } from "@/components/ui/skeleton";

import { INVITE_SET_PASSWORD_PATH, userNeedsPasswordSet } from "@/features/auth/lib/user-password-setup";

import { useAppShellStore } from "@/stores/use-app-shell-store";



/** Redirect authenticated users away from public auth routes. */

export function PublicAuthRedirect({

  fallback = "/app",

  children,

}: {

  fallback?: string;

  children: ReactNode;

}) {

  const router = useRouter();

  const hydrated = useAppShellStore((s) => s.authHydrated);

  const user = useAppShellStore((s) => s.user);



  useEffect(() => {

    if (!hydrated || !user) return;

    const next = userNeedsPasswordSet(user) ? INVITE_SET_PASSWORD_PATH : fallback;

    router.replace(next);

  }, [hydrated, user, router, fallback]);



  if (!hydrated) {

    return (

      <div className="flex min-h-[min(560px,calc(100dvh-4rem))] flex-col items-center justify-center gap-4 px-6 py-14">

        <Skeleton className="h-14 w-[13rem] rounded-2xl" />

        <Skeleton className="h-44 w-full max-w-md rounded-3xl" />

        <p className="eyebrow">Loading session</p>

      </div>

    );

  }



  if (user) {

    return (

      <div className="flex min-h-[min(520px,calc(100dvh-4rem))] flex-col items-center justify-center gap-4 px-6 py-14">

        <Loader2 className="size-9 animate-spin text-primary/70" aria-hidden />

        <p className="text-sm font-medium text-muted-foreground">

          Signing you in…

        </p>

      </div>

    );

  }



  return (

    <>

      <BrandBar />

      {children}

    </>

  );

}

