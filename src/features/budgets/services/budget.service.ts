import {
  computeCategoryDerivedFields,
  sumCategoryAdjustedTotals,
} from "@/features/budgets/lib/budget-aggregates";
import type {
  CreateBudgetCategorySeedSchema,
  RenameBudgetCategorySchema,
} from "@/features/budgets/schemas/budget.schemas";
import type { BudgetCategoryRow, MonthlyBudgetRow } from "@/features/budgets/types";
import { insertBudgetCategoriesFromHouseholdTemplates } from "@/features/categories/services/category.service";
import { getSupabaseBrowser } from "@/services/supabase-client";

function asDbMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as { message?: string; details?: string; hint?: string };
    const text = [e.message, e.details, e.hint].filter(Boolean).join(" — ");
    if (text) return text;
  }
  return "Request failed";
}

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function mapBudgetRow(data: Record<string, unknown>): MonthlyBudgetRow {
  return {
    id: String(data.id),
    household_id: String(data.household_id),
    year: toNum(data.year),
    month: toNum(data.month),
    total_budget: toNum(data.total_budget),
    total_spent: toNum(data.total_spent),
    total_remaining: toNum(data.total_remaining),
    forecast_spent: toNum(data.forecast_spent),
    forecast_savings: toNum(data.forecast_savings),
    status: data.status as MonthlyBudgetRow["status"],
    approved_by:
      data.approved_by == null ? null : String(data.approved_by),
    approved_at:
      data.approved_at == null ? null : String(data.approved_at),
    closed_at: data.closed_at == null ? null : String(data.closed_at),
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
  };
}

function mapCategoryRow(data: Record<string, unknown>): BudgetCategoryRow {
  return {
    id: String(data.id),
    monthly_budget_id: String(data.monthly_budget_id),
    household_id: String(data.household_id),
    name: String(data.name),
    slug: String(data.slug),
    category_type: data.category_type as BudgetCategoryRow["category_type"],
    planned_amount: toNum(data.planned_amount),
    adjusted_amount: toNum(data.adjusted_amount),
    spent_amount: toNum(data.spent_amount),
    remaining_amount: toNum(data.remaining_amount),
    usage_percent: toNum(data.usage_percent),
    display_order: toNum(data.display_order),
    color_token: data.color_token == null ? null : String(data.color_token),
    icon_name: data.icon_name == null ? null : String(data.icon_name),
    is_active: Boolean(data.is_active),
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
  };
}

function slugifyCategory(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "category"}-${Math.random().toString(36).slice(2, 8)}`;
}

export const budgetService = {
  async listMonthlyBudgets(householdId: string): Promise<MonthlyBudgetRow[]> {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("household_id", householdId)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) throw new Error(asDbMessage(error));
    return (data ?? []).map((r) =>
      mapBudgetRow(r as unknown as Record<string, unknown>)
    );
  },

  async getMonthlyBudget(
    budgetId: string,
    householdId: string
  ): Promise<MonthlyBudgetRow | null> {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("id", budgetId)
      .eq("household_id", householdId)
      .maybeSingle();

    if (error) throw new Error(asDbMessage(error));
    if (!data) return null;
    return mapBudgetRow(data as unknown as Record<string, unknown>);
  },

  async createMonthlyBudget(opts: {
    householdId: string;
    year: number;
    month: number;
  }): Promise<MonthlyBudgetRow> {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("monthly_budgets")
      .insert({
        household_id: opts.householdId,
        year: opts.year,
        month: opts.month,
        total_budget: 0,
        total_spent: 0,
        total_remaining: 0,
        forecast_spent: 0,
        forecast_savings: 0,
        status: "draft",
      })
      .select("*")
      .single();

    if (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";
      if (code === "23505") {
        throw new Error("A monthly budget already exists for that period.");
      }
      throw new Error(asDbMessage(error));
    }
    const row = mapBudgetRow(data as unknown as Record<string, unknown>);
    await insertBudgetCategoriesFromHouseholdTemplates({
      supabase,
      householdId: opts.householdId,
      monthlyBudgetId: row.id,
    });
    await budgetService.syncMonthlyBudgetTotals(row.id);
    return row;
  },

  async listCategories(monthlyBudgetId: string): Promise<BudgetCategoryRow[]> {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("monthly_budget_id", monthlyBudgetId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw new Error(asDbMessage(error));
    return (data ?? []).map((r) =>
      mapCategoryRow(r as unknown as Record<string, unknown>)
    );
  },

  async createBudgetCategory(
    input: CreateBudgetCategorySeedSchema
  ): Promise<BudgetCategoryRow> {
    const supabase = getSupabaseBrowser();
    const { data: existing } = await supabase
      .from("budget_categories")
      .select("display_order")
      .eq("monthly_budget_id", input.monthlyBudgetId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder =
      existing?.display_order != null
        ? toNum(existing.display_order) + 1
        : 0;

    const planned = input.plannedAmount;
    const derived = computeCategoryDerivedFields({
      planned_amount: planned,
      adjusted_amount: planned,
      spent_amount: 0,
      id: "",
      monthly_budget_id: input.monthlyBudgetId,
      household_id: input.householdId,
      name: input.name,
      slug: "",
      category_type: input.categoryType,
      display_order: nextOrder,
      color_token: null,
      icon_name: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    });

    const slug = slugifyCategory(input.name);

    const { data, error } = await supabase
      .from("budget_categories")
      .insert({
        monthly_budget_id: input.monthlyBudgetId,
        household_id: input.householdId,
        name: input.name.trim(),
        slug,
        category_type: input.categoryType,
        planned_amount: planned,
        adjusted_amount: planned,
        spent_amount: 0,
        remaining_amount: derived.remaining_amount,
        usage_percent: derived.usage_percent,
        display_order: nextOrder,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw new Error(asDbMessage(error));
    const row = mapCategoryRow(data as unknown as Record<string, unknown>);
    await budgetService.syncMonthlyBudgetTotals(input.monthlyBudgetId);
    return row;
  },

  /** Updates label and regenerates slug (unique per monthly_budget). Requires can_manage_budget. */
  async updateBudgetCategoryName(
    input: RenameBudgetCategorySchema
  ): Promise<BudgetCategoryRow> {
    const trimmed = input.name.trim();
    const slug = slugifyCategory(trimmed);
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("budget_categories")
      .update({ name: trimmed, slug })
      .eq("id", input.categoryId)
      .eq("household_id", input.householdId)
      .eq("monthly_budget_id", input.monthlyBudgetId)
      .select("*")
      .single();

    if (error) throw new Error(asDbMessage(error));
    return mapCategoryRow(data as unknown as Record<string, unknown>);
  },

  async updateCategoryAdjustedDirect(input: {
    monthlyBudgetId: string;
    categoryId: string;
    adjustedAmount: number;
  }): Promise<BudgetCategoryRow> {
    const supabase = getSupabaseBrowser();
    const { data: cur, error: readErr } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("id", input.categoryId)
      .eq("monthly_budget_id", input.monthlyBudgetId)
      .single();

    if (readErr) throw new Error(asDbMessage(readErr));
    const base = mapCategoryRow(cur as unknown as Record<string, unknown>);
    const derived = computeCategoryDerivedFields({
      ...base,
      adjusted_amount: input.adjustedAmount,
    });

    const { data, error } = await supabase
      .from("budget_categories")
      .update({
        adjusted_amount: input.adjustedAmount,
        remaining_amount: derived.remaining_amount,
        usage_percent: derived.usage_percent,
      })
      .eq("id", input.categoryId)
      .select("*")
      .single();

    if (error) throw new Error(asDbMessage(error));
    await budgetService.syncMonthlyBudgetTotals(input.monthlyBudgetId);
    return mapCategoryRow(data as unknown as Record<string, unknown>);
  },

  /** Owner/admin only per RLS. Fails if linked rows exist (e.g. transactions). */
  async deleteBudgetCategory(input: {
    householdId: string;
    monthlyBudgetId: string;
    categoryId: string;
  }): Promise<void> {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", input.categoryId)
      .eq("household_id", input.householdId)
      .eq("monthly_budget_id", input.monthlyBudgetId);

    if (error) throw new Error(asDbMessage(error));
    await budgetService.syncMonthlyBudgetTotals(input.monthlyBudgetId);
  },

  async approveBudget(budgetId: string, actorUserId: string): Promise<void> {
    const supabase = getSupabaseBrowser();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("monthly_budgets")
      .update({
        status: "active",
        approved_by: actorUserId,
        approved_at: now,
      })
      .eq("id", budgetId)
      .eq("status", "draft");

    if (error) throw new Error(asDbMessage(error));
  },

  async closeMonth(budgetId: string): Promise<void> {
    const supabase = getSupabaseBrowser();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("monthly_budgets")
      .update({
        status: "closed",
        closed_at: now,
      })
      .eq("id", budgetId)
      .eq("status", "active");

    if (error) throw new Error(asDbMessage(error));
  },

  async syncMonthlyBudgetTotals(monthlyBudgetId: string): Promise<void> {
    const supabase = getSupabaseBrowser();
    const categories = await budgetService.listCategories(monthlyBudgetId);
    const { sumAdjusted, sumSpent } = sumCategoryAdjustedTotals(categories);
    const remaining = sumAdjusted - sumSpent;
    const { error } = await supabase
      .from("monthly_budgets")
      .update({
        total_budget: sumAdjusted,
        total_spent: sumSpent,
        total_remaining: remaining,
      })
      .eq("id", monthlyBudgetId);

    if (error) throw new Error(asDbMessage(error));
  },

  /**
   * Recompute each category's spent from posted, non-deleted transactions,
   * update derived fields, then refresh the monthly budget rollup row.
   */
  async refreshCategorySpendFromTransactions(
    monthlyBudgetId: string,
    householdId: string
  ): Promise<void> {
    const supabase = getSupabaseBrowser();
    const { data: rows, error } = await supabase
      .from("transactions")
      .select("budget_category_id, amount")
      .eq("monthly_budget_id", monthlyBudgetId)
      .eq("household_id", householdId)
      .is("deleted_at", null)
      .eq("status", "posted");

    if (error) throw new Error(asDbMessage(error));

    const byCat = new Map<string, number>();
    for (const r of rows ?? []) {
      const id = String(r.budget_category_id);
      byCat.set(id, (byCat.get(id) ?? 0) + toNum(r.amount));
    }

    const categories = await budgetService.listCategories(monthlyBudgetId);
    for (const c of categories) {
      const spent = byCat.get(c.id) ?? 0;
      const derived = computeCategoryDerivedFields({
        ...c,
        spent_amount: spent,
      });
      const { error: upErr } = await supabase
        .from("budget_categories")
        .update({
          spent_amount: spent,
          remaining_amount: derived.remaining_amount,
          usage_percent: derived.usage_percent,
        })
        .eq("id", c.id);

      if (upErr) throw new Error(asDbMessage(upErr));
    }

    await budgetService.syncMonthlyBudgetTotals(monthlyBudgetId);
  },
};
