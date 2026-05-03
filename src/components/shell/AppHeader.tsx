"use client";

import { appShellContentClassName } from "@/components/shell/app-shell-content";
import { AppLogoLink } from "@/components/shell/AppLogoLink";
import { ShellProfileMenu } from "@/components/shell/ShellProfileMenu";
import { useProfileQuery } from "@/features/auth/hooks/use-profile-query";
import { authService } from "@/features/auth/services/auth.service";
import type { HouseholdMembership } from "@/features/household/types";
import { useAppShellStore } from "@/stores/use-app-shell-store";

export function AppHeader({
  memberships,
}: {
  memberships: HouseholdMembership[];
}) {
  const user = useAppShellStore((s) => s.user);
  const { data: profile } = useProfileQuery(Boolean(user?.id));

  async function signOut() {
    await authService.signOut();
    window.location.href = "/login";
  }

  const headerLayout =
    "flex items-center justify-between gap-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-4";

  const profileMenu = user ? (
    <ShellProfileMenu
      user={user}
      profile={profile ?? null}
      memberships={memberships}
      onSignOut={signOut}
      className="shrink-0"
    />
  ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/55 bg-card/82 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/72">
      <div className={`${appShellContentClassName} ${headerLayout}`}>
        <AppLogoLink href="/app" priority className="shrink-0" />
        {profileMenu}
      </div>
    </header>
  );
}
