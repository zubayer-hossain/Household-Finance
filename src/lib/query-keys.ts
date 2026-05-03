export const qk = {
  profile: ["profile"] as const,
  householdMemberships: ["household-memberships"] as const,
  members: (householdId: string) => ["members", householdId] as const,
  household: (householdId: string) => ["household", householdId] as const,
  householdDeletionAssessment: (householdId: string) =>
    ["household-deletion-assessment", householdId] as const,
};
