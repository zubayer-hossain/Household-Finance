import { PublicAuthRedirect } from "@/features/auth/components/PublicAuthRedirect";
import { SignupForm } from "@/features/auth/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="surface-market min-h-dvh">
      <PublicAuthRedirect fallback="/app">
        <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center px-5 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-14">
          <SignupForm />
        </div>
      </PublicAuthRedirect>
    </div>
  );
}
