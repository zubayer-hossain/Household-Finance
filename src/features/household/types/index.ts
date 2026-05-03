export type HouseholdRole = "owner" | "admin" | "contributor" | "viewer";

export interface HouseholdCapabilities {
  canInviteMember: boolean;
  canViewMembers: boolean;
  canManageHousehold: boolean;
  /**
   * Budget module gate (planned). Until Budget ships, callers may safely read these booleans when
   * sketching UX; they intentionally mirror roster roles so shells do not regress when rules land.
   */
  canViewBudget: boolean;
  /** Edit draft lines, allocations, templates — excludes structural household-admin tasks. */
  canEditBudget: boolean;
  /** Close periods, post or approve consolidated budget movements — elevated money control. */
  canManageBudget: boolean;
}

export interface HouseholdRecord {
  id: string;
  name: string;
  slug: string;
  base_currency: string;
  timezone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMembership {
  householdId: string;
  role: HouseholdRole;
  household: HouseholdRecord;
}

export interface MemberRow {
  id: string;
  user_id: string;
  role: HouseholdRole;
  status: "invited" | "active" | "removed";
  joined_at: string | null;
  users: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    preferred_language: string;
  } | null;
}

export function resolveHouseholdCapabilities(
  role: HouseholdRole | null | undefined
): HouseholdCapabilities {
  if (!role) {
    return {
      canInviteMember: false,
      canViewMembers: false,
      canManageHousehold: false,
      canViewBudget: false,
      canEditBudget: false,
      canManageBudget: false,
    };
  }

  if (role === "owner" || role === "admin") {
    return {
      canInviteMember: true,
      canViewMembers: true,
      canManageHousehold: true,
      canViewBudget: true,
      canEditBudget: true,
      canManageBudget: true,
    };
  }

  if (role === "contributor") {
    return {
      canInviteMember: false,
      canViewMembers: true,
      canManageHousehold: false,
      canViewBudget: true,
      canEditBudget: true,
      canManageBudget: false,
    };
  }

  return {
    canInviteMember: false,
    canViewMembers: true,
    canManageHousehold: false,
    canViewBudget: true,
    canEditBudget: false,
    canManageBudget: false,
  };
}
