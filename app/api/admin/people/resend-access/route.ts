import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/people/resend-access
 * body: { email: string }
 *
 * For an account that already exists (password forgotten, invite email
 * never arrived, or — like this one — the person genuinely doesn't
 * remember what they set). `inviteUserByEmail` only works for brand-new,
 * unconfirmed users; this uses `resetPasswordForEmail` instead, which
 * works regardless of whether the account already has a password, and
 * sends a real email through the same Supabase mailer. Lands on the same
 * /register page as a first-time invite — it just calls
 * `auth.updateUser({ password })` either way, so one page handles both.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { data: caller } = await supabase.from("users").select("role").eq("id", auth.user.id).single();
  if (caller?.role !== "super_admin") return NextResponse.json({ error: "Only an admin can do this." }, { status: 403 });

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "email is required." }, { status: 400 });

  const admin = createAdminClient();
  const redirectTo = `${req.nextUrl.origin}/register`;
  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
