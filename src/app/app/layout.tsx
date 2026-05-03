import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { HouseholdBootstrap } from "@/features/household/components/HouseholdBootstrap";

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <HouseholdBootstrap>{children}</HouseholdBootstrap>
    </AuthGuard>
  );
}
