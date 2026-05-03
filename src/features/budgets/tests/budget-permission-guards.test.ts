import { describe, expect, it } from "vitest";

import { resolveHouseholdCapabilities } from "@/features/household/types";

describe("Budget permission surface (capability gates)", () => {
  it("grants full elevated budget actions to owner and admin", () => {
    for (const role of ["owner", "admin"] as const) {
      const c = resolveHouseholdCapabilities(role);
      expect(c.canViewBudgets).toBe(true);
      expect(c.canCreateBudget).toBe(true);
      expect(c.canEditBudget).toBe(true);
      expect(c.canApproveBudget).toBe(true);
      expect(c.canCloseMonth).toBe(true);
    }
  });

  it("allows contributor viewing and drafting edits but blocks approval workflows", () => {
    const c = resolveHouseholdCapabilities("contributor");
    expect(c.canViewBudgets).toBe(true);
    expect(c.canCreateBudget).toBe(true);
    expect(c.canEditBudget).toBe(true);
    expect(c.canApproveBudget).toBe(false);
    expect(c.canCloseMonth).toBe(false);
  });

  it("locks elevated budget actions for viewers", () => {
    const c = resolveHouseholdCapabilities("viewer");
    expect(c.canViewBudgets).toBe(true);
    expect(c.canCreateBudget).toBe(false);
    expect(c.canEditBudget).toBe(false);
    expect(c.canApproveBudget).toBe(false);
    expect(c.canCloseMonth).toBe(false);
  });
});
