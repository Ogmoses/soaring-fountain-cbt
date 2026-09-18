import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeAccessToken, reasonMessage } from "@/lib/accessTokens";

/**
 * POST /api/auth/set-password
 * body: { token: string, password: string }
 *
 * Public route — no session exists yet at this point. The token itself is
 * the credential; see lib/accessTokens.ts for how it's validated and why
 * it's only ever consumed here (on submit), never on page load.
 */
export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json({ error: "token and password are required." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await consumeAccessToken(admin, { token, purpose: "invite" });
  if (!result.ok) {
    return NextResponse.json({ error: reasonMessage(result.reason) }, { status: 400 });
  }

  const { error } = await admin.auth.admin.updateUserById(result.userId, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, email: result.email });
}
