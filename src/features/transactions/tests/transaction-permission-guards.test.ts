import { describe, expect, it } from "vitest";

import { resolveHouseholdCapabilities } from "@/features/household/types";
import {
  canDeleteTransactionRow,
  canEditTransactionRow,
} from "@/features/transactions/lib/transaction-permissions";

describe("Transaction capability surface", () => {
  it("grants owner/admin full transaction actions", () => {
    for (const role of ["owner", "admin"] as const) {
      const c = resolveHouseholdCapabilities(role);
      expect(c.canViewTransactions).toBe(true);
      expect(c.canCreateTransaction).toBe(true);
      expect(c.canEditOwnTransaction).toBe(true);
      expect(c.canEditAnyTransaction).toBe(true);
      expect(c.canDeleteOwnTransaction).toBe(true);
      expect(c.canDeleteAnyTransaction).toBe(true);
    }
  });

  it("allows contributors to create and manage own rows only", () => {
    const c = resolveHouseholdCapabilities("contributor");
    expect(c.canCreateTransaction).toBe(true);
    expect(c.canEditOwnTransaction).toBe(true);
    expect(c.canEditAnyTransaction).toBe(false);
    expect(c.canDeleteOwnTransaction).toBe(true);
    expect(c.canDeleteAnyTransaction).toBe(false);
  });

  it("locks viewers to read-only", () => {
    const c = resolveHouseholdCapabilities("viewer");
    expect(c.canViewTransactions).toBe(true);
    expect(c.canCreateTransaction).toBe(false);
    expect(c.canEditOwnTransaction).toBe(false);
    expect(c.canDeleteOwnTransaction).toBe(false);
  });
});

describe("Transaction row guard helpers", () => {
  const tx = { created_by: "user-a" };

  it("lets elevated roles edit any row", () => {
    const caps = resolveHouseholdCapabilities("owner");
    expect(canEditTransactionRow(tx, "user-b", caps)).toBe(true);
    expect(canDeleteTransactionRow(tx, "user-b", caps)).toBe(true);
  });

  it("lets contributors edit only their own rows", () => {
    const caps = resolveHouseholdCapabilities("contributor");
    expect(canEditTransactionRow(tx, "user-a", caps)).toBe(true);
    expect(canEditTransactionRow(tx, "user-b", caps)).toBe(false);
    expect(canDeleteTransactionRow(tx, "user-a", caps)).toBe(true);
    expect(canDeleteTransactionRow(tx, "user-b", caps)).toBe(false);
  });
});
