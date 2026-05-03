import { describe, expect, it } from "vitest";

import { categoryService } from "@/features/categories/services/category.service";

describe("categoryService surface", () => {
  it("exposes CRUD and reorder entry points", () => {
    expect(typeof categoryService.listForHousehold).toBe("function");
    expect(typeof categoryService.listActiveTemplates).toBe("function");
    expect(typeof categoryService.create).toBe("function");
    expect(typeof categoryService.update).toBe("function");
    expect(typeof categoryService.archive).toBe("function");
    expect(typeof categoryService.unarchive).toBe("function");
    expect(typeof categoryService.reorder).toBe("function");
  });
});
