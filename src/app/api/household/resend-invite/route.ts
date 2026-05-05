import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createServiceRoleClient,
  deliverPendingInviteEmail,
  InviteeAlreadySignedInError,
  toErrorMessage,
} from "@/app/api/household/lib/server-invite-mail";
import { createSupabaseServer } from "@/services/supabase-server";

const bodySchema = z.object({
  householdId: z.string().uuid(),
  membershipId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { householdId, membershipId } = parsed.data;

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

    const { data: inviteRow, error: rowErr } = await serviceRoleClient
      .from("household_members")
      .select("id, user_id, status")
      .eq("id", membershipId)
      .eq("household_id", householdId)
      .maybeSingle();

    if (rowErr) {
      return NextResponse.json({ error: rowErr.message }, { status: 400 });
    }
    if (!inviteRow || inviteRow.status !== "invited") {
      return NextResponse.json(
        { error: "No pending invitation found for that person." },
        { status: 404 }
      );
    }

    const { data: pubUser } = await serviceRoleClient
      .from("users")
      .select("full_name")
      .eq("id", inviteRow.user_id)
      .maybeSingle();
    const seedDisplayName = pubUser?.full_name?.trim() || undefined;

    const forwardedProtoRaw = req.headers.get("x-forwarded-proto");
    const forwardedProto = forwardedProtoRaw?.split(",")[0]?.trim();
    const forwardedHostRaw = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const forwardedHost = forwardedHostRaw?.split(",")[0]?.trim();

    const configuredOrigin =
      process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_APP_ORIGIN;

    const inviteOrigin =
      // Prefer reverse-proxy headers so we don't end up with Passenger's internal localhost.
      (forwardedHost
        ? `${forwardedProto ?? "https"}://${forwardedHost}`
        : null) ??
      configuredOrigin ??
      req.headers.get("origin") ??
      new URL(req.url).origin;

    await deliverPendingInviteEmail(
      serviceRoleClient,
      inviteRow.user_id,
      inviteOrigin,
      seedDisplayName
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof InviteeAlreadySignedInError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    console.error("[household/resend-invite]", toErrorMessage(e));
    const message = toErrorMessage(e) || "Could not resend invitation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
