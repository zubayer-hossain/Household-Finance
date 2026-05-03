"use client";

import { useState } from "react";

import { CreateHouseholdStep } from "@/features/household/components/CreateHouseholdStep";
import {
  OnboardingChrome,
  WelcomeStep,
} from "@/features/household/components/WelcomeStep";

export default function OnboardingPage() {
  const [step, setStep] = useState<0 | 1>(0);

  return (
    <OnboardingChrome>
      {step === 0 ? (
        <WelcomeStep onNext={() => setStep(1)} />
      ) : (
        <CreateHouseholdStep />
      )}
    </OnboardingChrome>
  );
}
