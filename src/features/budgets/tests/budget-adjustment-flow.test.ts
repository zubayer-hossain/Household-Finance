import { describe, expect, it } from "vitest";

function simulateAdjustment(previous: number, next: number) {
  const delta = next - previous;
  return { previous_amount: previous, new_amount: next, delta_amount: delta };
}

describe("Budget adjustment bookkeeping", () => {
  it("keeps delta equal to new minus previous", () => {
    expect(simulateAdjustment(80, 100)).toEqual({
      previous_amount: 80,
      new_amount: 100,
      delta_amount: 20,
    });
    expect(simulateAdjustment(50, 50).delta_amount).toBe(0);
  });
});
