import { describe, expect, it } from "vitest";

describe("Household category archive semantics", () => {
  it("treats rows with archived_at as inactive templates", () => {
    const rows = [
      { id: "1", archived_at: null as string | null },
      { id: "2", archived_at: "2026-05-01T00:00:00.000Z" },
    ];
    const active = rows.filter((r) => r.archived_at == null);
    expect(active.map((r) => r.id)).toEqual(["1"]);
  });
});
