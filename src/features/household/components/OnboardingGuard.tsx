"use client";



import type { ReactNode } from "react";

import { useEffect } from "react";

import { useRouter } from "next/navigation";



import { BrandBar } from "@/components/shell/BrandBar";

import { Skeleton } from "@/components/ui/skeleton";

import { useHouseholdMembershipsQuery } from "@/features/household/hooks/use-household-memberships-query";

import { useAppShellStore } from "@/stores/use-app-shell-store";



/** Onboarding is only for authenticated users with no active household membership. */

export function OnboardingGuard({ children }: { children: ReactNode }) {

  const router = useRouter();

  const hydrated = useAppShellStore((s) => s.authHydrated);



  const { data, isLoading, isError, error } =

    useHouseholdMembershipsQuery(Boolean(hydrated));



  useEffect(() => {

    if (!hydrated || isLoading || isError) return;

    if (data && data.length > 0) router.replace("/app");

  }, [data, hydrated, isLoading, isError, router]);



  if (!hydrated)

    return (

      <div className="flex min-h-[40vh] items-center justify-center px-6">

        <Skeleton className="h-14 w-56 rounded-2xl" />

      </div>

    );



  if (isLoading)

    return (

      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6">

        <Skeleton className="h-14 w-56 rounded-2xl" />

        <Skeleton className="mx-auto h-3 w-32 rounded-full opacity-65" />

      </div>

    );



  if (isError) {

    return (

      <>

        <BrandBar />

        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-3 px-6 py-14 text-center">

          <p className="text-sm font-medium leading-relaxed text-destructive">

            {error instanceof Error

              ? error.message

              : "Could not load your households."}

          </p>

          <p className="max-w-[22rem] text-sm leading-relaxed text-muted-foreground">

            Run the latest Supabase migrations, then refresh this page.

          </p>

        </div>

      </>

    );

  }



  if (data && data.length > 0) return null;



  return (

    <>

      <BrandBar />

      {children}

    </>

  );

}

