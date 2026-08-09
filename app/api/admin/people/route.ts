import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin-only account management for students and teachers.
 *   POST   — create an account. Generates a temporary credential (a 6-digit
 *            PIN for students, a random password for teachers) since there's
 *            no self-service email invite flow for a lab full of shared
 *            school computers — the admin hands the credential to the person
 *            directly. Returned once, never stored in plain text anywhere.
 *   PATCH  — update profile fields, or toggle is_active.
 *   DELETE — deletes the Supabase Auth user, which cascades to their
 *            `users` row (see `users.id references auth.users(id) on delete
 *            cascade` in database/schema.sql).
 *
 * NOTE: teacher `subjectNames` picked in the form aren't persisted yet —
 * `teacher_subjects` needs a (teacher, subject, class) triple and this form
 * only collects subjects, not which classes they're taught to. That
 * assignment belongs in its own screen; for now it's accepted but ignored.
 */

async function assertIsAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, status: 401, error: "Not signed in." };
  const { data: profile } = await supabase.from("users").select("role").eq("id", auth.user.id).single();
  if (profile?.role !== "super_admin") return { ok: false as const, status: 403, error: "Only an admin can manage accounts." };
  return { ok: true as const };
}

function generateCredential(role: "student" | "teacher"): string {
  if (role === "student") return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit PIN
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6); // ~10-char password
}

export async function POST(req: NextRequest) {
  const guard = await assertIsAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { role, fullName, email, admissionNumber, staffId, classId } = await req.json();
  if (!role || !fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "role, fullName, and email are required." }, { status: 400 });
  }

  const credential = generateCredential(role);
  const admin = createAdminClient();

  const { data: created, error: authError } = await admin.auth.admin.createUser({ email, password: credential, email_confirm: true });
  if (authError || !created.user) {
    return NextResponse.json({ error: authError?.message ?? "Couldn't create the account." }, { status: 500 });
  }

  const { error: profileError } = await admin.from("users").insert({
    id: created.user.id,
    role,
    full_name: fullName,
    email,
    admission_number: role === "student" ? admissionNumber || null : null,
    staff_id: role === "teacher" ? staffId || null : null,
    class_id: role === "student" ? classId || null : null,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id); // roll back the orphaned auth user
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ id: created.user.id, credential });
}

export async function PATCH(req: NextRequest) {
  const guard = await assertIsAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id, fullName, email, admissionNumber, staffId, classId, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const admin = createAdminClient();
  const patch: Record<string, unknown> = {};
  if (fullName !== undefined) patch.full_name = fullName;
  if (admissionNumber !== undefined) patch.admission_number = admissionNumber || null;
  if (staffId !== undefined) patch.staff_id = staffId || null;
  if (classId !== undefined) patch.class_id = classId || null;
  if (isActive !== undefined) patch.is_active = isActive;

  const { error } = await admin.from("users").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (email) {
    const { error: authError } = await admin.auth.admin.updateUserById(id, { email });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
    await admin.from("users").update({ email }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const guard = await assertIsAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
