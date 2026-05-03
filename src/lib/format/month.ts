/** `monthIndex` — 1 = January … 12 = December */

export function formatCalendarMonth(
  year: number,
  monthIndex: number,
  locale: string | undefined = "en",
  timeZone?: string
): string {
  if (monthIndex < 1 || monthIndex > 12) return `${year}-${String(monthIndex)}`;
  const date = new Date(Date.UTC(year, monthIndex - 1, 1));
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: timeZone ?? "UTC",
    }).format(date);
  } catch {
    return `${year}-${String(monthIndex).padStart(2, "0")}`;
  }
}

/** Parses `yyyy-mm` ISO month labels (budget periods). */
export function parseYearMonth(raw: string): { year: number; monthIndex: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const mo = Number(m[2]);
  if (!Number.isInteger(year) || mo < 1 || mo > 12) return null;
  return { year, monthIndex: mo };
}
