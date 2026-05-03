"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ReorderHouseholdCategoriesSchema } from "@/features/categories/schemas/category.schemas";
import { categoryService } from "@/features/categories/services/category.service";
import { qk } from "@/lib/query-keys";

export function useReorderHouseholdCategoriesMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderHouseholdCategoriesSchema) =>
      categoryService.reorder(input),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: qk.householdCategories(householdId, false),
      });
      void qc.invalidateQueries({
        queryKey: qk.householdCategories(householdId, true),
      });
    },
  });
}
