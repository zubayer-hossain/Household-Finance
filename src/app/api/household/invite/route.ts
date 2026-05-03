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

/** Auth / PostgREST often throw plain objects; `catch (e) => e.message` hides the real failure. */
function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string" && e.length > 0) return e;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.length > 0) {
      return o.message;
    }
    if (
      typeof o.error_description === "string" &&
      o.error_description.length > 0
    ) {
      return o.error_description;
    }
    if (typeof o.msg === "string" && o.msg.length > 0) return o.msg;
    try {
      return JSON.stringify(o);
    } catch {
      return "Unknown error";
    }
  }
  return "Unknown error";
}

function throwNorm(e: unknown): never {
  throw new Error(toErrorMessage(e));
}

function buildInviteMailOptions(inviteRedirectOrigin: string, seedDisplayName?: string) {
  const inviteOptions: {
    redirectTo: string;
    data?: Record<string, string>;
  } = {
    redirectTo:
      `${inviteRedirectOrigin.replace(/\/$/, "")}/auth/callback?next=` +
      encodeURIComponent("/app"),
  };
  if (seedDisplayName) inviteOptions.data = { full_name: seedDisplayName };
  return inviteOptions;
}

async function rpcAuthUidByEmail(svc: SupabaseClient, email: string): Promise<string | null> {
  const { data, error } = await svc.rpc("auth_uid_by_email", {
    p_email: email.trim().toLowerCase(),
  });
  if (error) {
    return null;
  }
  if (data == null) return null;
  return String(data);
}

function isProbablyDuplicateInviteError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg = "message" in error && typeof (error as { message: unknown }).message === "string"
    ? ((error as { message: string }).message).toLowerCase()
    : "";
  const desc =
    "error_description" in error &&
    typeof (error as { error_description: unknown }).error_description === "string"
      ? ((error as { error_description: string }).error_description).toLowerCase()
      : "";
  const hay = `${msg} ${desc}`;
  const status =
    "status" in error ? (error as { status?: unknown }).status : undefined;
  const codeRaw = "code" in error ? (error as { code?: unknown }).code : "";
  const code = typeof codeRaw === "string" ? codeRaw.toLowerCase() : "";
  return (
    status === 422 ||
    status === 409 ||
    code.includes("exists") ||
    code.includes("registered") ||
    code.includes("user_already_exists") ||
    hay.includes("already") ||
    hay.includes("registered") ||
    hay.includes("exists") ||
    hay.includes("duplicate")
  );
}

/**
 * Picks Auth user id and whether household_members rows should stay `invited` until first sign-in.
 * Uses DB RPC on auth.users — listUsers paging alone misses invite-only accounts and breaks re-invites.
 */
async function resolveInvitationTarget(
  svc: SupabaseClient,
  email: string,
  inviteRedirectOrigin: string,
  seedDisplayName?: string
): Promise<{ userId: string; membershipInvitePending: boolean }> {
  const emailNorm = email.trim().toLowerCase();
  const inviteOptions = buildInviteMailOptions(inviteRedirectOrigin, seedDisplayName);

  const existingUid =
    (await rpcAuthUidByEmail(svc, emailNorm)) ?? (await fallbackAuthUidViaListPages(svc, emailNorm));

  if (existingUid) {
    const { data, error } = await svc.auth.admin.getUserById(existingUid);
    if (error) throwNorm(error);
    const u = data.user;
    if (!u?.id) throw new Error("Could not load invited user.");

    const membershipInvitePending = !u.last_sign_in_at;
    if (membershipInvitePending) {
      const resent = await svc.auth.admin.inviteUserByEmail(emailNorm, inviteOptions);
      if (resent.error && !isProbablyDuplicateInviteError(resent.error)) {
        throwNorm(resent.error);
      }
    }
    return {
      userId: u.id,
      membershipInvitePending,
    };
  }

  const invited = await svc.auth.admin.inviteUserByEmail(emailNorm, inviteOptions);
  if (!invited.error && invited.data?.user?.id) {
    return { userId: invited.data.user.id, membershipInvitePending: true };
  }

  /** Brand-new invite duplicate / race — resolve id from auth.users (RPC). */
  if (invited.error && isProbablyDuplicateInviteError(invited.error)) {
    const dupUid =
      (await rpcAuthUidByEmail(svc, emailNorm)) ?? (await fallbackAuthUidViaListPages(svc, emailNorm));
    if (!dupUid) throwNorm(invited.error);
    const { data: got, error: getErr } = await svc.auth.admin.getUserById(dupUid);
    if (getErr) throwNorm(getErr);
    if (!got.user?.id) throwNorm(invited.error);
    const pending = !got.user.last_sign_in_at;
    if (pending) {
      const resent = await svc.auth.admin.inviteUserByEmail(emailNorm, inviteOptions);
      if (resent.error && !isProbablyDuplicateInviteError(resent.error)) {
        throwNorm(resent.error);
      }
    }
    return {
      userId: got.user.id,
      membershipInvitePending: pending,
    };
  }

  if (invited.error) throwNorm(invited.error);
  throw new Error("Invite did not return a user id.");
}

/** Fallback when RPC not deployed yet; still useful for legacy records. */
async function fallbackAuthUidViaListPages(
  svc: SupabaseClient,
  emailNorm: string
): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (page <= 15) {
    const res = await svc.auth.admin.listUsers({ page, perPage });
    if (res.error) throwNorm(res.error);

    const found = res.data.users.find((u) => u.email?.toLowerCase() === emailNorm);
    if (found?.id) return found.id;

    if (res.data.users.length < perPage) break;
    page++;
  }
  return null;
}

/**
 * household_members.user_id FK → public.users, not auth.users alone.
 * If insert into public.users failed at signup (rare), service-role inserts would 23503 until repaired.
 */
async function ensurePublicUserRow(
  svc: SupabaseClient,
  userId: string,
  seedDisplayName?: string
): Promise<void> {
  const { data: row, error: selErr } = await svc
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (selErr) throwNorm(selErr);
  if (row) return;

  const { data: authBundle, error: guErr } = await svc.auth.admin.getUserById(userId);
  if (guErr) throwNorm(guErr);
  const au = authBundle.user;
  if (!au?.id) {
    throw new Error("Invited user record missing; try again in a moment.");
  }

  const meta = au.user_metadata as Record<string, unknown> | undefined;
  const fromMeta =
    typeof meta?.full_name === "string"
      ? meta.full_name.trim()
      : typeof meta?.name === "string"
        ? meta.name.trim()
        : "";
  const fromEmail = au.email?.split("@")[0]?.trim() ?? "";
  const seed = seedDisplayName?.trim();
  const fullName =
    (seed && seed.length > 0 ? seed : "") || fromMeta || fromEmail || "Member";

  const langRaw = meta?.preferred_language;
  const preferred_language =
    typeof langRaw === "string" && (langRaw === "en" || langRaw === "bn")
      ? langRaw
      : "en";

  const { error: insErr } = await svc.from("users").insert({
    id: userId,
    full_name: fullName,
    avatar_url: null,
    preferred_language,
  });

  const code = insErr ? (insErr as { code?: string }).code : undefined;
  if (insErr && code !== "23505") {
    throwNorm(insErr);
  }
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
