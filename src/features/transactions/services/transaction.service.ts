import { budgetService } from "@/features/budgets/services/budget.service";
import type {
  CreateTransactionSchema,
  QuickAddExpenseSchema,
  UpdateTransactionSchema,
} from "@/features/transactions/schemas/transaction.schemas";
import type {
  TransactionRow,
  TransactionSourceType,
  TransactionStatus,
} from "@/features/transactions/types";
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

function mapTransactionRow(
  data: Record<string, unknown>,
  categoryName: string | null
): TransactionRow {
  return {
    id: String(data.id),
    household_id: String(data.household_id),
    monthly_budget_id: String(data.monthly_budget_id),
    budget_category_id: String(data.budget_category_id),
    created_by: String(data.created_by),
    amount: toNum(data.amount),
    note: data.note == null ? null : String(data.note),
    transaction_date: String(data.transaction_date),
    source_type: data.source_type as TransactionRow["source_type"],
    status: data.status as TransactionStatus,
    attachment_count: toNum(data.attachment_count),
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
    deleted_at: data.deleted_at == null ? null : String(data.deleted_at),
    category_name: categoryName,
  };
}

function normalizeEmbedCategory(
  embed: unknown
): string | null {
  if (!embed || typeof embed !== "object") return null;
  const o = embed as { name?: unknown };
  return o.name != null ? String(o.name) : null;
}

export const transactionService = {
  async listTransactions(opts: {
    householdId: string;
    monthlyBudgetId: string | null;
    budgetCategoryId?: string | null;
  }): Promise<TransactionRow[]> {
    if (!opts.monthlyBudgetId) return [];

    const supabase = getSupabaseBrowser();
    let q = supabase
      .from("transactions")
      .select(
        `
        *,
        budget_categories ( name )
      `
      )
      .eq("household_id", opts.householdId)
      .eq("monthly_budget_id", opts.monthlyBudgetId)
      .is("deleted_at", null)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (opts.budgetCategoryId) {
      q = q.eq("budget_category_id", opts.budgetCategoryId);
    }

    const { data, error } = await q;

    if (error) throw new Error(asDbMessage(error));

    return (data ?? []).map((raw) => {
      const r = raw as Record<string, unknown>;
      const bc = r.budget_categories;
      let catName: string | null = null;
      if (bc && typeof bc === "object" && !Array.isArray(bc)) {
        catName = normalizeEmbedCategory(bc);
      }
      const clean = { ...r };
      delete clean.budget_categories;
      return mapTransactionRow(clean, catName);
    });
  },

  async getTransaction(
    transactionId: string,
    householdId: string
  ): Promise<TransactionRow | null> {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        budget_categories ( name )
      `
      )
      .eq("id", transactionId)
      .eq("household_id", householdId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new Error(asDbMessage(error));
    if (!data) return null;

    const r = data as Record<string, unknown>;
    const bc = r.budget_categories;
    let catName: string | null = null;
    if (bc && typeof bc === "object" && !Array.isArray(bc)) {
      catName = normalizeEmbedCategory(bc);
    }
    const clean = { ...r };
    delete clean.budget_categories;
    return mapTransactionRow(clean, catName);
  },

  async createQuickExpense(
    input: QuickAddExpenseSchema,
    actorUserId: string
  ): Promise<TransactionRow> {
    return transactionService.createTransaction(
      {
        householdId: input.householdId,
        monthlyBudgetId: input.monthlyBudgetId,
        budgetCategoryId: input.budgetCategoryId,
        amount: input.amount,
        note: input.note ?? null,
        transactionDate: input.transactionDate,
      },
      actorUserId
    );
  },

  async createTransaction(
    input: CreateTransactionSchema,
    actorUserId: string
  ): Promise<TransactionRow> {
    const supabase = getSupabaseBrowser();
    const payload = {
      household_id: input.householdId,
      monthly_budget_id: input.monthlyBudgetId,
      budget_category_id: input.budgetCategoryId,
      created_by: actorUserId,
      amount: input.amount,
      note: input.note?.trim() ? input.note.trim() : null,
      transaction_date: input.transactionDate,
      source_type: "manual" as TransactionSourceType,
      status: "posted" as TransactionStatus,
      attachment_count: 0,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select(
        `
        *,
        budget_categories ( name )
      `
      )
      .single();

    if (error) throw new Error(asDbMessage(error));

    const r = data as Record<string, unknown>;
    const bc = r.budget_categories;
    let catName: string | null = null;
    if (bc && typeof bc === "object" && !Array.isArray(bc)) {
      catName = normalizeEmbedCategory(bc);
    }
    const clean = { ...r };
    delete clean.budget_categories;

    await budgetService.refreshCategorySpendFromTransactions(
      input.monthlyBudgetId,
      input.householdId
    );

    return mapTransactionRow(clean, catName);
  },

  async updateTransaction(input: UpdateTransactionSchema): Promise<TransactionRow> {
    const supabase = getSupabaseBrowser();
    const existing = await transactionService.getTransaction(
      input.id,
      input.householdId
    );
    if (!existing) throw new Error("Transaction not found.");

    const patch: Record<string, unknown> = {};
    if (input.monthlyBudgetId !== undefined)
      patch.monthly_budget_id = input.monthlyBudgetId;
    if (input.budgetCategoryId !== undefined)
      patch.budget_category_id = input.budgetCategoryId;
    if (input.amount !== undefined) patch.amount = input.amount;
    if (input.note !== undefined)
      patch.note = input.note?.trim() ? input.note.trim() : null;
    if (input.transactionDate !== undefined)
      patch.transaction_date = input.transactionDate;

    const { data, error } = await supabase
      .from("transactions")
      .update(patch)
      .eq("id", input.id)
      .eq("household_id", input.householdId)
      .select(
        `
        *,
        budget_categories ( name )
      `
      )
      .single();

    if (error) throw new Error(asDbMessage(error));

    const r = data as Record<string, unknown>;
    const bc = r.budget_categories;
    let catName: string | null = null;
    if (bc && typeof bc === "object" && !Array.isArray(bc)) {
      catName = normalizeEmbedCategory(bc);
    }
    const clean = { ...r };
    delete clean.budget_categories;

    const prevBudgetId = existing.monthly_budget_id;
    const nextBudgetId = String(
      input.monthlyBudgetId ?? existing.monthly_budget_id
    );

    const budgetsToRefresh = new Set<string>();
    budgetsToRefresh.add(prevBudgetId);
    if (nextBudgetId !== prevBudgetId) budgetsToRefresh.add(nextBudgetId);

    for (const bid of budgetsToRefresh) {
      await budgetService.refreshCategorySpendFromTransactions(
        bid,
        input.householdId
      );
    }

    return mapTransactionRow(clean, catName);
  },

  async softDeleteTransaction(
    transactionId: string,
    householdId: string
  ): Promise<void> {
    const supabase = getSupabaseBrowser();
    const existing = await transactionService.getTransaction(
      transactionId,
      householdId
    );
    if (!existing) throw new Error("Transaction not found.");

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: now })
      .eq("id", transactionId)
      .eq("household_id", householdId);

    if (error) throw new Error(asDbMessage(error));

    await budgetService.refreshCategorySpendFromTransactions(
      existing.monthly_budget_id,
      householdId
    );
  },
};
