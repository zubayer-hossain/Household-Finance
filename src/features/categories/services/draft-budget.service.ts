import type { MonthlyBudgetRow } from "@/features/budgets/types";
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

export type DraftDeleteEligibility = {
  canDelete: boolean;
  reason?: string;
};

export function evaluateDraftBudgetDeleteEligibility(
  budget: MonthlyBudgetRow | null | undefined,
  postedTransactionCount: number
): DraftDeleteEligibility {
  if (!budget) {
    return { canDelete: false, reason: "Budget could not be loaded." };
  }
  if (budget.status === "active") {
    return {
      canDelete: false,
      reason: "Active budgets cannot be deleted. Close the month first if you need to archive it.",
    };
  }
  if (budget.status === "closed") {
    return {
      canDelete: false,
      reason: "Closed budgets are kept for history and cannot be deleted.",
    };
  }
  if (budget.status !== "draft") {
    return { canDelete: false, reason: "Only draft budgets can be deleted." };
  }
  if (postedTransactionCount > 0) {
    return {
      canDelete: false,
      reason: `This draft has ${postedTransactionCount} expense${postedTransactionCount === 1 ? "" : "s"}. Remove or move them before deleting the draft.`,
    };
  }
  return { canDelete: true };
}

export const draftBudgetService = {
  async countLiveTransactions(
    monthlyBudgetId: string,
    householdId: string
  ): Promise<number> {
    const supabase = getSupabaseBrowser();
    const { count, error } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("monthly_budget_id", monthlyBudgetId)
      .eq("household_id", householdId)
      .is("deleted_at", null);

    if (error) throw new Error(asDbMessage(error));
    return count ?? 0;
  },

  async deleteDraftBudget(opts: {
    monthlyBudgetId: string;
    householdId: string;
  }): Promise<void> {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("monthly_budgets")
      .delete()
      .eq("id", opts.monthlyBudgetId)
      .eq("household_id", opts.householdId)
      .eq("status", "draft");

    if (error) throw new Error(asDbMessage(error));
  },
};
