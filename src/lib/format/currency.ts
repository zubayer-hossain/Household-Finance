/**
 * Monetary amounts are **major units** (e.g. whole takas/dollars) as stored in UI/API layers until
 * a dedicated ledger minor-unit strategy lands.
 */
export function formatCurrencyMajor(
  amount: number,
  currencyCode: string,
  locale: string | undefined = "en"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const rounded =
      Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
    return `${rounded} ${currencyCode.toUpperCase()}`;
  }
}
