import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServer } from "@/services/supabase-server";

const bodySchema = z.object({
  householdId: z.string().uuid(),
  email: z.string().trim().email().toLowerCase(),
  role: z.enum(["contributor", "viewer"]),
  fullName: z.string().trim().max(120).optional(),
});

async function resolveUserId(
  admin: SupabaseClient,
  email: string,
  inviteRedirectOrigin: string,
  seedDisplayName?: string
): Promise<{ userId: string; isNewInvite: boolean }> {
  let page = 1;
  const perPage = 200;

  while (page <= 15) {
    const res = await admin.auth.admin.listUsers({ page, perPage });
    if (res.error) throw res.error;

    const found = res.data.users.find((u) => u.email?.toLowerCase() === email);
    if (found?.id) return { userId: found.id, isNewInvite: false };

    if (res.data.users.length < perPage) break;
    page++;
  }

  const inviteOptions: {
    redirectTo: string;
    data?: Record<string, string>;
  } = {
    redirectTo:
      `${inviteRedirectOrigin.replace(/\/$/, "")}/auth/callback?next=` +
      encodeURIComponent("/onboarding"),
  };
  if (seedDisplayName) {
    inviteOptions.data = { full_name: seedDisplayName };
  }

  const invited = await admin.auth.admin.inviteUserByEmail(email, inviteOptions);

  if (invited.error) throw invited.error;
  const uid = invited.data?.user?.id;
  if (!uid) throw new Error("Invite did not return a user id.");

  return { userId: uid, isNewInvite: true };
}

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL or service role key.");
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { householdId, email, role, fullName } = parsed.data;
    const seedDisplayName =
      fullName && fullName.length > 0 ? fullName : undefined;

    let serviceRoleClient: ReturnType<typeof createServiceRoleClient>;
    try {
      serviceRoleClient = createServiceRoleClient();
    } catch {
      return NextResponse.json(
        { error: "Server invitation is not configured." },
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

    const { data: mem, error: memErr } = await supabase
      .from("household_members")
      .select("role")
      .eq("household_id", householdId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 400 });
    }
    if (!mem || (mem.role !== "owner" && mem.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const inviteOrigin =
      process.env.NEXT_PUBLIC_APP_ORIGIN ??
      req.headers.get("origin") ??
      new URL(req.url).origin;

    const { userId, isNewInvite } = await resolveUserId(
      serviceRoleClient,
      email,
      inviteOrigin,
      seedDisplayName
    );

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot invite yourself." },
        { status: 400 }
      );
    }

    const membershipInsert = await serviceRoleClient.from("household_members").insert({
      household_id: householdId,
      user_id: userId,
      role,
      status: isNewInvite ? "invited" : "active",
      invited_by: user.id,
      joined_at: isNewInvite ? null : new Date().toISOString(),
    });

    if (membershipInsert.error) {
      if ((membershipInsert.error as { code?: string }).code === "23505") {
        return NextResponse.json(
          { error: "User is already a member of this household." },
          { status: 409 }
        );
      }
      throw membershipInsert.error;
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Invitation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
