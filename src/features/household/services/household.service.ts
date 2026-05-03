import { getSupabaseBrowser } from "@/services/supabase-client";
import type { HouseholdMembership, HouseholdRecord } from "@/features/household/types";
import type { CreateHouseholdSchema } from "@/features/household/schemas/household.schemas";
import { buildHouseholdSlug } from "@/features/household/lib/slug";

function asDbMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as { message?: string; details?: string; hint?: string };
    const text = [e.message, e.details, e.hint].filter(Boolean).join(" — ");
    if (text) return text;
  }
  return "Request failed";
}

export type HouseholdDeletionAssessment = {
  allowed: boolean;
  reasons: string[];
};

export const householdService = {
  async listMyMemberships(): Promise<HouseholdMembership[]> {
    const supabase = getSupabaseBrowser();
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];

    const { data, error } = await supabase.rpc("list_my_household_memberships");

    if (error) throw new Error(asDbMessage(error));

    const raw = data as unknown;
    const rows: unknown[] = Array.isArray(raw)
      ? raw
      : raw != null && typeof raw === "object"
        ? [raw]
        : [];

    type RpcRow = {
      household_id: string;
      role: string;
      household: HouseholdRecord | null;
    };

    return rows.map((rowUntyped) => {
      const row = rowUntyped as RpcRow;
      if (!row?.household_id || !row.household) {
        throw new Error("Malformed membership row — missing household");
      }
      return {
        householdId: row.household_id,
        role: row.role as HouseholdMembership["role"],
        household: row.household,
      };
    });
  },

  async createHousehold(
    values: CreateHouseholdSchema
  ): Promise<HouseholdRecord> {
    const supabase = getSupabaseBrowser();
    const { user } = (await supabase.auth.getUser()).data;
    if (!user) throw new Error("Not authenticated");

    let lastError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      const slug =
        attempt === 0
          ? buildHouseholdSlug(values.name)
          : buildHouseholdSlug(`${values.name} ${attempt}`);

      const { data, error } = await supabase.rpc("create_my_household", {
        p_name: values.name.trim(),
        p_slug: slug,
        p_base_currency: values.baseCurrency,
        p_timezone: values.timezone,
      });

      if (!error && data) {
        const row = Array.isArray(data) ? data[0] : data;
        if (row) return row as HouseholdRecord;
      }

      if (error?.code === "23505") {
        lastError = error;
        continue;
      }
      throw new Error(asDbMessage(error));
    }

    throw new Error(
      asDbMessage(lastError) ||
        "Could not create household (slug conflict — try another name)."
    );
  },

  /** Updates display name. Slug stays stable; if the database rejects the update, retries with a fresh unique slug. */
  async updateHouseholdName(
    householdId: string,
    name: string
  ): Promise<HouseholdRecord> {
    const supabase = getSupabaseBrowser();
    const trimmed = name.trim();

    const nameOnly = await supabase
      .from("households")
      .update({ name: trimmed })
      .eq("id", householdId)
      .select("*")
      .maybeSingle();

    if (!nameOnly.error && nameOnly.data) {
      return nameOnly.data as HouseholdRecord;
    }
    if (nameOnly.error?.code !== "23505") {
      throw new Error(asDbMessage(nameOnly.error));
    }

    let lastErr: unknown = nameOnly.error;
    for (let attempt = 0; attempt < 6; attempt++) {
      const slug =
        attempt === 0
          ? buildHouseholdSlug(trimmed)
          : buildHouseholdSlug(`${trimmed} ${attempt}`);

      const { data, error } = await supabase
        .from("households")
        .update({ name: trimmed, slug })
        .eq("id", householdId)
        .select("*")
        .maybeSingle();

      if (!error && data) return data as HouseholdRecord;
      if (error?.code === "23505") {
        lastErr = error;
        continue;
      }
      throw new Error(asDbMessage(error));
    }

    throw new Error(
      asDbMessage(lastErr) ?? "Could not update household — try another name."
    );
  },

  /** Read-only guards for UX before showing delete UI. Owner-only delete is enforced in RLS. */
  async assessHouseholdDeletion(
    householdId: string
  ): Promise<HouseholdDeletionAssessment> {
    const supabase = getSupabaseBrowser();
    const reasons: string[] = [];

    const [activeMembers, budgets, txs, recurring] = await Promise.all([
      supabase
        .from("household_members")
        .select("*", { count: "exact", head: true })
        .eq("household_id", householdId)
        .eq("status", "active"),
      supabase
        .from("monthly_budgets")
        .select("*", { count: "exact", head: true })
        .eq("household_id", householdId),
      supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("household_id", householdId)
        .is("deleted_at", null),
      supabase
        .from("recurring_expenses")
        .select("*", { count: "exact", head: true })
        .eq("household_id", householdId),
    ]);

    const errs = [activeMembers.error, budgets.error, txs.error, recurring.error];
    const failed = errs.find(Boolean);
    if (failed) throw new Error(asDbMessage(failed));

    const memberCount = activeMembers.count ?? 0;
    if (memberCount > 1) {
      reasons.push(
        "Other active members belong to this household. Remove teammates or deactivate their memberships before deleting."
      );
    }

    if ((budgets.count ?? 0) > 0) {
      reasons.push(
        "Budget periods exist for this household. Clearing financial history isn’t supported from this screen yet."
      );
    }

    if ((txs.count ?? 0) > 0) {
      reasons.push(
        "Posted or draft transactions exist. Delete isn’t allowed while records remain."
      );
    }

    if ((recurring.count ?? 0) > 0) {
      reasons.push(
        "Recurring expense templates exist for this household. Remove them before deleting."
      );
    }

    return { allowed: reasons.length === 0, reasons };
  },

  async deleteHousehold(householdId: string): Promise<void> {
    const { allowed, reasons } =
      await householdService.assessHouseholdDeletion(householdId);
    if (!allowed) throw new Error(reasons.join("\n"));

    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("households")
      .delete()
      .eq("id", householdId);
    if (error) throw new Error(asDbMessage(error));
  },

  async getHouseholdProfile(
    householdId: string
  ): Promise<HouseholdRecord | null> {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("households")
      .select("*")
      .eq("id", householdId)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as HouseholdRecord | null;
  },
};
