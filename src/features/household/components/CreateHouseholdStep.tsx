"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HouseholdCreatorForm } from "@/features/household/components/HouseholdCreatorForm";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function CreateHouseholdStep() {
  const setActiveMembership = useAppShellStore((s) => s.setActiveMembership);

  return (
    <Card className="mx-auto w-full max-w-xl border-input/85 shadow-soft">
      <CardHeader>
        <p className="eyebrow pb-1">Step 2 of 2</p>
        <h2 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-[1.75rem]">
          Name your household
        </h2>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          You become the owner. You can invite others after this step.
        </p>
      </CardHeader>
      <CardContent className="pb-7 pt-1">
        <HouseholdCreatorForm
          idleLabel="Finish & enter app"
          submittingLabel="Creating…"
          submitLabel="Finish & enter app"
          onSuccess={async (row) => {
            setActiveMembership(row.id, "owner");
            window.location.assign("/app");
          }}
        />
      </CardContent>
    </Card>
  );
}
