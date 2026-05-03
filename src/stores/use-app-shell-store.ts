import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  resolveHouseholdCapabilities,
  type HouseholdCapabilities,
  type HouseholdRole,
} from "@/features/household/types";
import type { Session, User } from "@supabase/supabase-js";

interface AppShellState {
  session: Session | null;
  user: User | null;
  authHydrated: boolean;
  activeHouseholdId: string | null;
  activeMembershipRole: HouseholdRole | null;
  resolvedCapabilities: HouseholdCapabilities | null;
  setAuth: (session: Session | null, user: User | null, hydrated?: boolean) => void;
  setActiveMembership: (
    householdId: string | null,
    role: HouseholdRole | null
  ) => void;
}

export const useAppShellStore = create<AppShellState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      authHydrated: false,
      activeHouseholdId: null,
      activeMembershipRole: null,
      resolvedCapabilities: null,
      setAuth(session, user, hydrated = true) {
        const prev = get().user?.id;
        if (prev !== user?.id) {
          set({
            activeHouseholdId: null,
            activeMembershipRole: null,
            resolvedCapabilities: null,
          });
        }
        set({ session, user, authHydrated: hydrated });
      },
      setActiveMembership(householdId, role) {
        set({
          activeHouseholdId: householdId,
          activeMembershipRole: role,
          resolvedCapabilities: role
            ? resolveHouseholdCapabilities(role)
            : null,
        });
      },
    }),
    {
      name: "mf-app-shell",
      partialize: (s) => ({ activeHouseholdId: s.activeHouseholdId }),
    }
  )
);
