import { describe, expect, it } from "vitest";

function simulateReallocation(opts: {
  fromAdjusted: number;
  toAdjusted: number;
  amount: number;
}) {
  if (opts.amount <= 0) throw new Error("Amount must be positive");
  if (opts.fromAdjusted < opts.amount) {
    throw new Error("Not enough allocated in the source category");
  }
  return {
    fromAdjusted: opts.fromAdjusted - opts.amount,
    toAdjusted: opts.toAdjusted + opts.amount,
  };
}

describe("Budget reallocation math", () => {
  it("moves allocation between categories", () => {
    const r = simulateReallocation({
      fromAdjusted: 300,
      toAdjusted: 100,
      amount: 40,
    });
    expect(r.fromAdjusted).toBe(260);
    expect(r.toAdjusted).toBe(140);
  });

  it("rejects transfers larger than source allocation", () => {
    expect(() =>
      simulateReallocation({
        fromAdjusted: 25,
        toAdjusted: 10,
        amount: 26,
      })
    ).toThrow(/Not enough/);
  });
});
