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
 */

function generateCredential(role: "student" | "teacher"): string {
  if (role === "student") return String(Math.floor(100000 + Math.random() * 900000));
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
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
  const results: { email: string; ok: boolean; error?: string; credential?: string }[] = [];

  for (const row of rows) {
    const credential = generateCredential(role);
    try {
      const { data: created, error: authError } = await admin.auth.admin.createUser({ email: row.email, password: credential, email_confirm: true });
      if (authError || !created.user) throw new Error(authError?.message ?? "Couldn't create the account.");

      const { error: profileError } = await admin.from("users").insert({
        id: created.user.id,
        role,
        full_name: row.fullName,
        email: row.email,
        admission_number: role === "student" ? row.admissionNumber || null : null,
        staff_id: role === "teacher" ? row.staffId || null : null,
        class_id: role === "student" ? row.classId || null : null,
        is_active: true,
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw new Error(profileError.message);
      }

      results.push({ email: row.email, ok: true, credential });
    } catch (err) {
      results.push({ email: row.email, ok: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  const successCount = results.filter((r) => r.ok).length;
  return NextResponse.json({ successCount, failureCount: results.length - successCount, results });
}
