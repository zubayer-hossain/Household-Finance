import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServer } from "@/services/supabase-server";

const bodySchema = z.object({
  householdId: z.string().uuid(),
  membershipId: z.string().uuid(),
  fullName: z.string().trim().min(1, "Name is required").max(120),
});

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL or service role key.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function PATCH(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.flatten().fieldErrors.fullName?.[0] ?? "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    let serviceRoleClient: ReturnType<typeof createServiceRoleClient>;
    try {
      serviceRoleClient = createServiceRoleClient();
    } catch {
      return NextResponse.json(
        { error: "Server profile update is not configured." },
        { status: 503 }
      );
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: caller, error: memErr } = await supabase
      .from("household_members")
      .select("role")
      .eq("household_id", parsed.data.householdId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 400 });
    }
    if (!caller || (caller.role !== "owner" && caller.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { householdId, membershipId, fullName } = parsed.data;

    const { data: row, error: rowErr } = await serviceRoleClient
      .from("household_members")
      .select("user_id, status")
      .eq("id", membershipId)
      .eq("household_id", householdId)
      .maybeSingle();

    if (rowErr) {
      return NextResponse.json({ error: rowErr.message }, { status: 400 });
    }
    if (!row) {
      return NextResponse.json({ error: "Member not found in this household." }, { status: 404 });
    }
    if (row.status !== "invited") {
      return NextResponse.json(
        { error: "You can only rename people with a pending invitation." },
        { status: 400 }
      );
    }

    const { error: authLookupErr, data: authUser } =
      await serviceRoleClient.auth.admin.getUserById(row.user_id);
    if (authLookupErr || !authUser.user) {
      return NextResponse.json(
        { error: authLookupErr?.message ?? "Invited user not found." },
        { status: 400 }
      );
    }

    const existingMeta = authUser.user.user_metadata as Record<string, unknown> | undefined;
    const mergedMeta = {
      ...(existingMeta && typeof existingMeta === "object" ? existingMeta : {}),
      full_name: fullName,
    };

    const { error: authUpdateErr } = await serviceRoleClient.auth.admin.updateUserById(
      row.user_id,
      { user_metadata: mergedMeta }
    );
    if (authUpdateErr) {
      return NextResponse.json({ error: authUpdateErr.message }, { status: 400 });
    }

    const { error: profileErr } = await serviceRoleClient
      .from("users")
      .update({ full_name: fullName })
      .eq("id", row.user_id);
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
