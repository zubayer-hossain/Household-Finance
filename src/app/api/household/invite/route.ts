import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createServiceRoleClient,
  ensurePublicUserRow,
  resolveInvitationTarget,
  throwNorm,
  toErrorMessage,
} from "@/app/api/household/lib/server-invite-mail";
import { createSupabaseServer } from "@/services/supabase-server";

const bodySchema = z.object({
  householdId: z.string().uuid(),
  email: z.string().trim().email().toLowerCase(),
  role: z.enum(["contributor", "viewer"]),
  fullName: z.string().trim().max(120).optional(),
});

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

    const { userId, membershipInvitePending } = await resolveInvitationTarget(
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

    await ensurePublicUserRow(serviceRoleClient, userId, seedDisplayName);

    const membershipInsert = await serviceRoleClient.from("household_members").insert({
      household_id: householdId,
      user_id: userId,
      role,
      status: membershipInvitePending ? "invited" : "active",
      invited_by: user.id,
      joined_at: membershipInvitePending ? null : new Date().toISOString(),
    });

    if (membershipInsert.error) {
      const insCode = (membershipInsert.error as { code?: string }).code;
      if (insCode === "23505") {
        return NextResponse.json(
          { error: "User is already a member of this household." },
          { status: 409 }
        );
      }
      if (insCode === "23503") {
        return NextResponse.json(
          {
            error:
              "Could not link invitation to user profile (database constraint). Support can fix orphaned accounts.",
          },
          { status: 500 }
        );
      }
      throwNorm(membershipInsert.error);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[household/invite]", toErrorMessage(e));
    const message = toErrorMessage(e) || "Invitation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
