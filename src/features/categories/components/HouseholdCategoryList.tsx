"use client";

import { HouseholdCategoryListItem } from "@/features/categories/components/HouseholdCategoryListItem";
import type { HouseholdCategoryRow } from "@/features/categories/types";

export function HouseholdCategoryList({
  categories,
  currency,
  locale,
  canManage,
  onEdit,
  onArchive,
  onRestore,
  archivingId,
  restoringId,
}: {
  categories: HouseholdCategoryRow[];
  currency: string;
  locale: string | undefined;
  canManage: boolean;
  onEdit: (row: HouseholdCategoryRow) => void;
  onArchive: (row: HouseholdCategoryRow) => void;
  onRestore: (row: HouseholdCategoryRow) => void;
  archivingId: string | null;
  restoringId: string | null;
}) {
  return (
    <ul className="flex flex-col gap-2.5" aria-label="Household categories">
      {categories.map((c) => (
        <li key={c.id}>
          <HouseholdCategoryListItem
            row={c}
            currency={currency}
            locale={locale}
            canManage={canManage}
            onEdit={() => onEdit(c)}
            onArchive={() => onArchive(c)}
            onRestore={() => onRestore(c)}
            archiving={archivingId === c.id}
            restoring={restoringId === c.id}
          />
        </li>
      ))}
    </ul>
  );
}
