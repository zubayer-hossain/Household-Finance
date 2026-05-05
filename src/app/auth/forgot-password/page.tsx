import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { PublicAuthRedirect } from "@/features/auth/components/PublicAuthRedirect";

export default function ForgotPasswordPage() {
  return (
    <div className="surface-market min-h-dvh">
      <PublicAuthRedirect fallback="/app">
        <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center px-5 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-14">
          <ForgotPasswordForm />
        </div>
      </PublicAuthRedirect>
    </div>
  );
}
