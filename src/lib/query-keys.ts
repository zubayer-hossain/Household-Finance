export const qk = {
  profile: ["profile"] as const,
  householdMemberships: ["household-memberships"] as const,
  members: (householdId: string) => ["members", householdId] as const,
  household: (householdId: string) => ["household", householdId] as const,
  householdDeletionAssessment: (householdId: string) =>
    ["household-deletion-assessment", householdId] as const,
  budgets: (householdId: string | null) => ["budgets", householdId] as const,
  budget: (budgetId: string) => ["budget", budgetId] as const,
  budgetCategories: (budgetId: string) =>
    ["budget-categories", budgetId] as const,
};
