import {
  computeCategoryDerivedFields,
} from "@/features/budgets/lib/budget-aggregates";
import type {
  CreateHouseholdCategorySchema,
  ReorderHouseholdCategoriesSchema,
  UpdateHouseholdCategorySchema,
} from "@/features/categories/schemas/category.schemas";
import type { HouseholdCategoryRow } from "@/features/categories/types";
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

function mapRow(data: Record<string, unknown>): HouseholdCategoryRow {
  return {
    id: String(data.id),
    household_id: String(data.household_id),
    name: String(data.name),
    slug: String(data.slug),
    category_type: data.category_type as HouseholdCategoryRow["category_type"],
    default_amount: toNum(data.default_amount),
    display_order: toNum(data.display_order),
    archived_at: data.archived_at == null ? null : String(data.archived_at),
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
  };
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "category"}-${Math.random().toString(36).slice(2, 8)}`;
}

export const categoryService = {
  async listForHousehold(
    householdId: string,
    opts?: { includeArchived?: boolean }
  ): Promise<HouseholdCategoryRow[]> {
    const supabase = getSupabaseBrowser();
    let q = supabase
      .from("household_categories")
      .select("*")
      .eq("household_id", householdId)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (!opts?.includeArchived) {
      q = q.is("archived_at", null);
    }

    const { data, error } = await q;
    if (error) throw new Error(asDbMessage(error));
    return (data ?? []).map((r) =>
      mapRow(r as unknown as Record<string, unknown>)
    );
  },

  /** Active templates only — used when prefilling a new monthly budget. */
  async listActiveTemplates(householdId: string): Promise<HouseholdCategoryRow[]> {
    return categoryService.listForHousehold(householdId, { includeArchived: false });
  },

  async create(input: CreateHouseholdCategorySchema): Promise<HouseholdCategoryRow> {
    const supabase = getSupabaseBrowser();
    const { data: last } = await supabase
      .from("household_categories")
      .select("display_order")
      .eq("household_id", input.householdId)
      .is("archived_at", null)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder =
      last?.display_order != null ? toNum(last.display_order) + 1 : 0;

    const slug = slugify(input.name);

    const { data, error } = await supabase
      .from("household_categories")
      .insert({
        household_id: input.householdId,
        name: input.name.trim(),
        slug,
        category_type: input.categoryType,
        default_amount: input.defaultAmount,
        display_order: nextOrder,
      })
      .select("*")
      .single();

    if (error) throw new Error(asDbMessage(error));
    return mapRow(data as unknown as Record<string, unknown>);
  },

  async update(input: UpdateHouseholdCategorySchema): Promise<HouseholdCategoryRow> {
    const supabase = getSupabaseBrowser();
    const slug = slugify(input.name);
    const { data, error } = await supabase
      .from("household_categories")
      .update({
        name: input.name.trim(),
        slug,
        category_type: input.categoryType,
        default_amount: input.defaultAmount,
      })
      .eq("id", input.categoryId)
      .eq("household_id", input.householdId)
      .is("archived_at", null)
      .select("*")
      .single();

    if (error) throw new Error(asDbMessage(error));
    return mapRow(data as unknown as Record<string, unknown>);
  },

  async archive(householdId: string, categoryId: string): Promise<HouseholdCategoryRow> {
    const supabase = getSupabaseBrowser();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("household_categories")
      .update({ archived_at: now })
      .eq("id", categoryId)
      .eq("household_id", householdId)
      .is("archived_at", null)
      .select("*")
      .single();

    if (error) throw new Error(asDbMessage(error));
    return mapRow(data as unknown as Record<string, unknown>);
  },

  async unarchive(householdId: string, categoryId: string): Promise<HouseholdCategoryRow> {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("household_categories")
      .update({ archived_at: null })
      .eq("id", categoryId)
      .eq("household_id", householdId)
      .not("archived_at", "is", null)
      .select("*")
      .single();

    if (error) throw new Error(asDbMessage(error));
    return mapRow(data as unknown as Record<string, unknown>);
  },

  async reorder(input: ReorderHouseholdCategoriesSchema): Promise<void> {
    const supabase = getSupabaseBrowser();
    for (let i = 0; i < input.orderedCategoryIds.length; i += 1) {
      const id = input.orderedCategoryIds[i];
      const { error } = await supabase
        .from("household_categories")
        .update({ display_order: i })
        .eq("id", id)
        .eq("household_id", input.householdId)
        .is("archived_at", null);

      if (error) throw new Error(asDbMessage(error));
    }
  },
};

/**
 * Insert budget_categories for a new monthly budget from active household templates.
 * Called from budget service after monthly_budget row exists.
 */
export async function insertBudgetCategoriesFromHouseholdTemplates(opts: {
  supabase: ReturnType<typeof getSupabaseBrowser>;
  householdId: string;
  monthlyBudgetId: string;
}): Promise<void> {
  const templates = await categoryService.listActiveTemplates(opts.householdId);
  if (templates.length === 0) return;

  const rows = templates.map((t, index) => {
    const planned = t.default_amount;
    const derived = computeCategoryDerivedFields({
      planned_amount: planned,
      adjusted_amount: planned,
      spent_amount: 0,
      id: "",
      monthly_budget_id: opts.monthlyBudgetId,
      household_id: opts.householdId,
      name: t.name,
      slug: "",
      category_type: t.category_type,
      display_order: t.display_order ?? index,
      color_token: null,
      icon_name: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    });

    const slug = slugify(t.name);

    return {
      monthly_budget_id: opts.monthlyBudgetId,
      household_id: opts.householdId,
      name: t.name,
      slug,
      category_type: t.category_type,
      planned_amount: planned,
      adjusted_amount: planned,
      spent_amount: 0,
      remaining_amount: derived.remaining_amount,
      usage_percent: derived.usage_percent,
      display_order: t.display_order ?? index,
      is_active: true,
    };
  });

  const { error } = await opts.supabase.from("budget_categories").insert(rows);
  if (error) throw new Error(asDbMessage(error));
}
