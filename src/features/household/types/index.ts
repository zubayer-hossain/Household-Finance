export type HouseholdRole = "owner" | "admin" | "contributor" | "viewer";

export interface HouseholdCapabilities {
  canInviteMember: boolean;
  canViewMembers: boolean;
  canManageHousehold: boolean;
  /**
   * Budget module (planned) — stable permission surface before RLS/feature work lands.
   * UI-only keys; enforcement remains in Postgres policies when Budget ships.
   */
  /** Read budgets, summaries, comparisons. */
  canViewBudgets: boolean;
  /** Start a new budget period, template shell, or zero-based draft scoped to household rules. */
  canCreateBudget: boolean;
  /** Edit draft allocations, amounts, categories while not finalized. */
  canEditBudget: boolean;
  /** Sign off postings or reconcile planned vs settled figures (elevated). */
  canApproveBudget: boolean;
  /** Fiscal close / lock periods so spend cannot rewrite history. */
  canCloseMonth: boolean;

  /** Household spending category templates (/app/categories). */
  canViewCategories: boolean;
  canManageCategories: boolean;
  /** Remove a draft monthly budget with no expenses (guarded in DB + UI). */
  canDeleteDraftBudget: boolean;

  /** Transactions module — capability surface matches RLS + triggers. */
  canViewTransactions: boolean;
  canCreateTransaction: boolean;
  canEditOwnTransaction: boolean;
  canEditAnyTransaction: boolean;
  canDeleteOwnTransaction: boolean;
  canDeleteAnyTransaction: boolean;
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
      canViewBudgets: false,
      canCreateBudget: false,
      canEditBudget: false,
      canApproveBudget: false,
      canCloseMonth: false,
      canViewCategories: false,
      canManageCategories: false,
      canDeleteDraftBudget: false,
      canViewTransactions: false,
      canCreateTransaction: false,
      canEditOwnTransaction: false,
      canEditAnyTransaction: false,
      canDeleteOwnTransaction: false,
      canDeleteAnyTransaction: false,
    };
  }

  if (role === "owner" || role === "admin") {
    return {
      canInviteMember: true,
      canViewMembers: true,
      canManageHousehold: true,
      canViewBudgets: true,
      canCreateBudget: true,
      canEditBudget: true,
      canApproveBudget: true,
      canCloseMonth: true,
      canViewCategories: true,
      canManageCategories: true,
      canDeleteDraftBudget: true,
      canViewTransactions: true,
      canCreateTransaction: true,
      canEditOwnTransaction: true,
      canEditAnyTransaction: true,
      canDeleteOwnTransaction: true,
      canDeleteAnyTransaction: true,
    };
  }

  if (role === "contributor") {
    return {
      canInviteMember: false,
      canViewMembers: true,
      canManageHousehold: false,
      canViewBudgets: true,
      canCreateBudget: true,
      canEditBudget: true,
      canApproveBudget: false,
      canCloseMonth: false,
      canViewCategories: true,
      canManageCategories: true,
      canDeleteDraftBudget: true,
      canViewTransactions: true,
      canCreateTransaction: true,
      canEditOwnTransaction: true,
      canEditAnyTransaction: false,
      canDeleteOwnTransaction: true,
      canDeleteAnyTransaction: false,
    };
  }

  return {
    canInviteMember: false,
    canViewMembers: true,
    canManageHousehold: false,
    canViewBudgets: true,
    canCreateBudget: false,
    canEditBudget: false,
    canApproveBudget: false,
    canCloseMonth: false,
    canViewCategories: true,
    canManageCategories: false,
    canDeleteDraftBudget: false,
    canViewTransactions: true,
    canCreateTransaction: false,
    canEditOwnTransaction: false,
    canEditAnyTransaction: false,
    canDeleteOwnTransaction: false,
    canDeleteAnyTransaction: false,
  };
}
