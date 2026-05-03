import { describe, expect, it } from "vitest";

import { formatCurrencyMajor } from "@/lib/format/currency";
import { formatCalendarMonth, parseYearMonth } from "@/lib/format/month";
import { formatPercentFromFraction } from "@/lib/format/percent";
import {
  testHouseholdCurrencies,
  testLocales,
} from "@/test/fixtures";

describe("formatCurrencyMajor", () => {
  it("formats common household currencies deterministically across locales", () => {
    for (const locale of testLocales) {
      const bdt = formatCurrencyMajor(1200.5, testHouseholdCurrencies[0], locale);
      expect(bdt.length).toBeGreaterThan(0);
      expect(bdt).toContain("1");
    }
    const usd = formatCurrencyMajor(
      10,
      testHouseholdCurrencies[1],
      "en-US"
    );
    expect(usd).toMatch(/\$10/);
  });

  it("falls back when currency code invalid", () => {
    expect(formatCurrencyMajor(1, "ZZZXXX", "en")).toContain("1");
  });
});

describe("formatCalendarMonth", () => {
  it("formats May boundary", () => {
    expect(formatCalendarMonth(2026, 5, "en", "UTC")).toMatch(/2026/i);
  });

  it("returns safe string for impossible month indexes", () => {
    expect(formatCalendarMonth(2026, 0, "en", "UTC")).toBe("2026-0");
  });
});

describe("parseYearMonth", () => {
  it("accepts yyyy-mm", () => {
    expect(parseYearMonth("2026-05")).toEqual({ year: 2026, monthIndex: 5 });
    expect(parseYearMonth("garbage")).toBeNull();
  });
});

describe("formatPercentFromFraction", () => {
  it("round-trips fractional rate", () => {
    expect(formatPercentFromFraction(0.085, 1)).toBe("8.5%");
    expect(formatPercentFromFraction(Number.NaN)).toBe("—");
  });
});
