"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { categoryService } from "@/features/categories/services/category.service";
import { qk } from "@/lib/query-keys";

export function useUnarchiveHouseholdCategoryMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      categoryService.unarchive(householdId!, categoryId),
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
