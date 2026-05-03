"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateHouseholdCategorySchema } from "@/features/categories/schemas/category.schemas";
import { categoryService } from "@/features/categories/services/category.service";
import { qk } from "@/lib/query-keys";

export function useCreateHouseholdCategoryMutation(householdId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHouseholdCategorySchema) =>
      categoryService.create(input),
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
