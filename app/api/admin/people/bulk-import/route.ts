import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/people/bulk-import
 * body: { role: "student" | "teacher", rows: ImportRow[] }
 *
 * One row failing (duplicate email, etc.) shouldn't sink the other 40 in
 * the file — every row gets its own try/catch, and the response reports
 * exactly which ones failed and why instead of an all-or-nothing result.
 *
 * Same split as the single-account route: students get a 4-digit PIN
 * back; teachers get an actual invite email sent per row and no
 * credential at all — importing 40 teachers means 40 invite emails going
 * out, which needs Supabase's email sending actually configured for a
 * batch that size (see the route.ts note on this).
 */

function generateStudentPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { data: caller } = await supabase.from("users").select("role").eq("id", auth.user.id).single();
  if (caller?.role !== "super_admin") return NextResponse.json({ error: "Only an admin can import accounts." }, { status: 403 });

  const { role, rows } = await req.json();
  if (!role || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "role and a non-empty rows array are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const redirectTo = `${req.nextUrl.origin}/register`;
  const results: { email: string; ok: boolean; error?: string; credential?: string; invited?: boolean }[] = [];

  for (const row of rows) {
    try {
      let authUserId: string;
      let credential: string | undefined;

      if (role === "student") {
        credential = generateStudentPin();
        const { data: created, error: authError } = await admin.auth.admin.createUser({ email: row.email, password: credential, email_confirm: true });
        if (authError || !created.user) throw new Error(authError?.message ?? "Couldn't create the account.");
        authUserId = created.user.id;
      } else {
        const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(row.email, { redirectTo });
        if (inviteError || !invited.user) throw new Error(inviteError?.message ?? "Couldn't send the invite email.");
        authUserId = invited.user.id;
      }

      const { error: profileError } = await admin.from("users").insert({
        id: authUserId,
        role,
        full_name: row.fullName,
        email: row.email,
        admission_number: role === "student" ? row.admissionNumber || null : null,
        staff_id: role === "teacher" ? row.staffId || null : null,
        class_id: role === "student" ? row.classId || null : null,
        is_active: true,
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(authUserId);
        throw new Error(profileError.message);
      }

      results.push({ email: row.email, ok: true, credential, invited: role !== "student" });
    } catch (err) {
      results.push({ email: row.email, ok: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  const successCount = results.filter((r) => r.ok).length;
  return NextResponse.json({ successCount, failureCount: results.length - successCount, results });
}
