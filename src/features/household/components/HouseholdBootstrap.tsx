"use client";



import type { ReactNode } from "react";

import { useRouter } from "next/navigation";

import { useEffect } from "react";



import { AppShell } from "@/components/shell/AppShell";

import { Skeleton } from "@/components/ui/skeleton";

import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";

import { useHouseholdContextSync } from "@/features/household/hooks/use-household-context-sync";

import { useAppShellStore } from "@/stores/use-app-shell-store";



export function HouseholdBootstrap({ children }: { children: ReactNode }) {

  const router = useRouter();

  const hydrated = useAppShellStore((s) => s.authHydrated);



  const { data, isLoading, isError, error } =

    useHouseholdMembershipsQuery(Boolean(hydrated));

  useHouseholdContextSync(data);



  useEffect(() => {

    if (!hydrated || isLoading || isError) return;

    if (!data || data.length === 0) router.replace("/onboarding");

  }, [data, hydrated, isLoading, isError, router]);



  if (!hydrated || isLoading)

    return (

      <div className="surface-market flex min-h-dvh flex-col">

        <div className="flex flex-1 items-center justify-center p-10">

          <div className="w-full max-w-md space-y-4">

            <Skeleton className="h-28 w-full rounded-3xl shadow-soft" />

            <Skeleton className="h-4 w-2/3 rounded-full mx-auto opacity-70" />

          </div>

        </div>

      </div>

    );



  if (isError) {

    return (

      <div className="surface-market flex min-h-dvh flex-col items-center justify-center px-6 py-14">

        <div className="w-full max-w-md rounded-[1.375rem] border border-border/90 bg-card p-8 text-center shadow-soft">

          <p className="text-sm font-medium leading-relaxed text-destructive">

            {error instanceof Error ? error.message : "Could not load your households."}

          </p>

          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">

            If you just migrated the database, run the latest migrations and refresh

            the page.

          </p>

        </div>

      </div>

    );

  }



  if (!data || data.length === 0) return null;



  return <AppShell memberships={data}>{children}</AppShell>;

}

