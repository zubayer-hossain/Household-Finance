import { describe, expect, it } from "vitest";

import { resolveHouseholdCapabilities } from "@/features/household/types";

describe("Category capability surface", () => {
  it("grants category management to owner, admin, and contributor", () => {
    for (const role of ["owner", "admin", "contributor"] as const) {
      const c = resolveHouseholdCapabilities(role);
      expect(c.canViewCategories).toBe(true);
      expect(c.canManageCategories).toBe(true);
      expect(c.canDeleteDraftBudget).toBe(true);
    }
  });

  it("allows viewer to view categories but not manage or delete drafts", () => {
    const c = resolveHouseholdCapabilities("viewer");
    expect(c.canViewCategories).toBe(true);
    expect(c.canManageCategories).toBe(false);
    expect(c.canDeleteDraftBudget).toBe(false);
  });
});
