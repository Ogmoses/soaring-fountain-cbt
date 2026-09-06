import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveStudentPassword, studentInternalEmail } from "@/lib/studentCredential";

/**
 * POST /api/admin/people/bulk-import
 * body: { role: "student" | "teacher", rows: ImportRow[] }
 *
 * One row failing (duplicate ID, etc.) shouldn't sink the other 40 in the
 * file — every row gets its own try/catch, and the response reports
 * exactly which ones failed and why instead of an all-or-nothing result.
 *
 * Same split as the single-account route: students log in with name +
 * student ID alone (see lib/studentCredential.ts), so there's no
 * credential to generate or report per row, and no email needed from the
 * CSV at all. Teachers get an actual invite email sent per row — importing
 * 40 teachers means 40 invite emails going out, which needs Supabase's
 * email sending actually configured for a batch that size.
 */

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
  // "identifier" is whichever field actually names the row in the results
  // list — a student's own student ID (they have no email at all now), or
  // a teacher's email (still how they're invited).
  const results: { identifier: string; ok: boolean; error?: string; invited?: boolean }[] = [];

  for (const row of rows) {
    const identifier = role === "student" ? (row.admissionNumber ?? row.fullName) : row.email;
    try {
      let authUserId: string;

      if (role === "student") {
        const email = studentInternalEmail(row.admissionNumber);
        const password = deriveStudentPassword(row.fullName, row.admissionNumber);
        const { data: created, error: authError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
        if (authError || !created.user) throw new Error(authError?.message ?? "Couldn't create the account.");
        authUserId = created.user.id;

        const { error: profileError } = await admin.from("users").insert({
          id: authUserId,
          role,
          full_name: row.fullName,
          email,
          admission_number: row.admissionNumber || null,
          class_id: row.classId || null,
          is_active: true,
        });
        if (profileError) {
          await admin.auth.admin.deleteUser(authUserId);
          throw new Error(profileError.message);
        }
      } else {
        const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(row.email, { redirectTo });
        if (inviteError || !invited.user) throw new Error(inviteError?.message ?? "Couldn't send the invite email.");
        authUserId = invited.user.id;

        const { error: profileError } = await admin.from("users").insert({
          id: authUserId,
          role,
          full_name: row.fullName,
          email: row.email,
          staff_id: row.staffId || null,
          is_active: true,
        });
        if (profileError) {
          await admin.auth.admin.deleteUser(authUserId);
          throw new Error(profileError.message);
        }
      }

      results.push({ identifier, ok: true, invited: role !== "student" });
    } catch (err) {
      results.push({ identifier, ok: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  const successCount = results.filter((r) => r.ok).length;
  return NextResponse.json({ successCount, failureCount: results.length - successCount, results });
}
