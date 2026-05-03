export type MonthlyBudgetStatus = "draft" | "active" | "closed";

export type BudgetCategoryType = "fixed" | "variable";

export type BudgetHealthState = "safe" | "warning" | "danger" | "over";

export interface MonthlyBudgetRow {
  id: string;
  household_id: string;
  year: number;
  month: number;
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  forecast_spent: number;
  forecast_savings: number;
  status: MonthlyBudgetStatus;
  approved_by: string | null;
  approved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategoryRow {
  id: string;
  monthly_budget_id: string;
  household_id: string;
  name: string;
  slug: string;
  category_type: BudgetCategoryType;
  planned_amount: number;
  adjusted_amount: number;
  spent_amount: number;
  remaining_amount: number;
  usage_percent: number;
  display_order: number;
  color_token: string | null;
  icon_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
