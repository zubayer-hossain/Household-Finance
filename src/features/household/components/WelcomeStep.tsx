"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card className="mx-auto w-full max-w-xl border-input/85 shadow-soft">
      <CardHeader>
        <p className="eyebrow pb-1">Step 1 of 2</p>
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-[1.75rem]">
          Welcome
        </h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          Create your household first. Shared budgets live inside this household.
        </p>
      </CardHeader>
      <CardFooter className="flex-col gap-3 px-6 pb-[1.5rem] pt-2">
        <Button type="button" className="w-full rounded-2xl" size="lg" onClick={onNext}>
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-xl text-muted-foreground"
          onClick={onNext}
        >
          Skip intro
        </Button>
      </CardFooter>
    </Card>
  );
}

export function OnboardingChrome({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 pb-24 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:px-6 md:gap-10 md:pt-12">
      {children}
      <footer className="rounded-2xl border border-border/60 bg-muted/45 px-4 py-3 text-center text-[11px] font-medium">
        <Link
          href="/app"
          className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Household Finance — auth module
        </Link>
      </footer>
    </div>
  );
}
