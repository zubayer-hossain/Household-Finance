import {
  computeCategoryDerivedFields,
} from "@/features/budgets/lib/budget-aggregates";
import { budgetService } from "@/features/budgets/services/budget.service";
import type { BudgetAdjustmentSchema } from "@/features/budgets/schemas/budget.schemas";
import type { BudgetCategoryRow } from "@/features/budgets/types";
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

export const budgetAdjustmentService = {
  /** Insert audit row then update category `adjusted_amount`; elevated-only at RLS. */
  async createAdjustment(
    input: BudgetAdjustmentSchema,
    actorUserId: string
  ): Promise<BudgetCategoryRow> {
    const supabase = getSupabaseBrowser();
    const { data: cat, error: readErr } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("id", input.budgetCategoryId)
      .eq("monthly_budget_id", input.monthlyBudgetId)
      .eq("household_id", input.householdId)
      .single();

    if (readErr) throw new Error(asDbMessage(readErr));

    const base = mapCategoryRow(cat as unknown as Record<string, unknown>);
    const previousAmount = base.adjusted_amount;
    const newAmount = input.newAmount;
    const delta = newAmount - previousAmount;

    const { error: adjErr } = await supabase.from("budget_adjustments").insert({
      household_id: input.householdId,
      monthly_budget_id: input.monthlyBudgetId,
      budget_category_id: input.budgetCategoryId,
      previous_amount: previousAmount,
      new_amount: newAmount,
      delta_amount: delta,
      reason: input.reason?.trim() || null,
      changed_by: actorUserId,
    });

    if (adjErr) throw new Error(asDbMessage(adjErr));

    const derived = computeCategoryDerivedFields({
      ...base,
      adjusted_amount: newAmount,
    });

    const { data: updated, error: updErr } = await supabase
      .from("budget_categories")
      .update({
        adjusted_amount: newAmount,
        remaining_amount: derived.remaining_amount,
        usage_percent: derived.usage_percent,
      })
      .eq("id", input.budgetCategoryId)
      .select("*")
      .single();

    if (updErr) throw new Error(asDbMessage(updErr));

    await budgetService.syncMonthlyBudgetTotals(input.monthlyBudgetId);

    return mapCategoryRow(updated as unknown as Record<string, unknown>);
  },
};
