import { computeCategoryDerivedFields } from "@/features/budgets/lib/budget-aggregates";
import { budgetService } from "@/features/budgets/services/budget.service";
import type { BudgetReallocationSchema } from "@/features/budgets/schemas/budget.schemas";
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

export const budgetReallocationService = {
  async reallocate(input: BudgetReallocationSchema, actorUserId: string) {
    const supabase = getSupabaseBrowser();
    const { data: fromRow, error: fromErr } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("id", input.fromCategoryId)
      .eq("monthly_budget_id", input.monthlyBudgetId)
      .eq("household_id", input.householdId)
      .single();

    if (fromErr) throw new Error(asDbMessage(fromErr));

    const { data: toRow, error: toErr } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("id", input.toCategoryId)
      .eq("monthly_budget_id", input.monthlyBudgetId)
      .eq("household_id", input.householdId)
      .single();

    if (toErr) throw new Error(asDbMessage(toErr));

    const fromCat = mapCategoryRow(fromRow as unknown as Record<string, unknown>);
    const toCat = mapCategoryRow(toRow as unknown as Record<string, unknown>);

    if (fromCat.adjusted_amount < input.amount) {
      throw new Error("Not enough allocated in the source category");
    }

    const fromNew = fromCat.adjusted_amount - input.amount;
    const toNew = toCat.adjusted_amount + input.amount;

    const { error: recErr } = await supabase.from("budget_reallocations").insert({
      household_id: input.householdId,
      monthly_budget_id: input.monthlyBudgetId,
      from_category_id: input.fromCategoryId,
      to_category_id: input.toCategoryId,
      amount: input.amount,
      reason: input.reason?.trim() || null,
      moved_by: actorUserId,
    });

    if (recErr) throw new Error(asDbMessage(recErr));

    const fromDerived = computeCategoryDerivedFields({
      ...fromCat,
      adjusted_amount: fromNew,
    });
    const toDerived = computeCategoryDerivedFields({
      ...toCat,
      adjusted_amount: toNew,
    });

    const { error: u1 } = await supabase
      .from("budget_categories")
      .update({
        adjusted_amount: fromNew,
        remaining_amount: fromDerived.remaining_amount,
        usage_percent: fromDerived.usage_percent,
      })
      .eq("id", input.fromCategoryId);

    if (u1) throw new Error(asDbMessage(u1));

    const { error: u2 } = await supabase
      .from("budget_categories")
      .update({
        adjusted_amount: toNew,
        remaining_amount: toDerived.remaining_amount,
        usage_percent: toDerived.usage_percent,
      })
      .eq("id", input.toCategoryId);

    if (u2) throw new Error(asDbMessage(u2));

    await budgetService.syncMonthlyBudgetTotals(input.monthlyBudgetId);

    return { ok: true as const };
  },
};
