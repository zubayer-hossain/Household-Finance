import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { OnboardingGuard } from "@/features/household/components/OnboardingGuard";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="surface-market min-h-dvh">
      <AuthGuard>
        <OnboardingGuard>{children}</OnboardingGuard>
      </AuthGuard>
    </div>
  );
}
