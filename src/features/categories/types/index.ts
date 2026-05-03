export type HouseholdCategoryType = "fixed" | "variable";

export interface HouseholdCategoryRow {
  id: string;
  household_id: string;
  name: string;
  slug: string;
  category_type: HouseholdCategoryType;
  default_amount: number;
  display_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
