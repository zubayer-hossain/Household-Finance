/** `decimalFraction`: 0.125 → `"12.5%"`. `basisPoints`-style callers can divide by 10_000 first. */

export function formatPercentFromFraction(
  decimalFraction: number,
  fractionDigits: number = 1
): string {
  if (!Number.isFinite(decimalFraction)) return "—";
  try {
    return new Intl.NumberFormat("en", {
      style: "percent",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(decimalFraction);
  } catch {
    const pct = decimalFraction * 100;
    return `${pct.toFixed(fractionDigits)}%`;
  }
}
