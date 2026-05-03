import { describe, expect, it } from "vitest";

import { deriveBudgetHealth } from "@/features/budgets/lib/budget-health";

describe("deriveBudgetHealth", () => {
  it("maps usage bands to UI states per spec thresholds", () => {
    expect(deriveBudgetHealth(0)).toBe("safe");
    expect(deriveBudgetHealth(69.9)).toBe("safe");
    expect(deriveBudgetHealth(70)).toBe("warning");
    expect(deriveBudgetHealth(89)).toBe("warning");
    expect(deriveBudgetHealth(90)).toBe("danger");
    expect(deriveBudgetHealth(100)).toBe("danger");
    expect(deriveBudgetHealth(100.1)).toBe("over");
  });
});
