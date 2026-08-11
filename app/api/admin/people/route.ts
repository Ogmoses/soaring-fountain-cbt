import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin-only account management for students and teachers.
 *   POST   — create an account.
 *            Students: a 4-digit PIN is generated and returned once —
 *            simple enough for a young student to remember or write down,
 *            shared computers in the lab don't lend themselves to email
 *            self-service anyway.
 *            Teachers: no password is set here at all. Supabase sends a
 *            real invite email; the teacher clicks it, lands on /register,
 *            and sets their own password. Requires Supabase's email
 *            sending to actually be configured — the built-in sender
 *            works for testing but is rate-limited; a school-scale rollout
 *            wants real SMTP configured (Supabase dashboard → Auth →
 *            Emails), or invites will bounce or land in spam.
 *   PATCH  — update profile fields, or toggle is_active.
 *   DELETE — deletes the Supabase Auth user, which cascades to their
 *            `users` row (see `users.id references auth.users(id) on delete
 *            cascade` in database/schema.sql).
 */

async function assertIsAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, status: 401, error: "Not signed in." };
  const { data: profile } = await supabase.from("users").select("role").eq("id", auth.user.id).single();
  if (profile?.role !== "super_admin") return { ok: false as const, status: 403, error: "Only an admin can manage accounts." };
  return { ok: true as const };
}

function generateStudentPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4-digit PIN
}

export async function POST(req: NextRequest) {
  const guard = await assertIsAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { role, fullName, email, admissionNumber, staffId, classId } = await req.json();
  if (!role || !fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "role, fullName, and email are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  let credential: string | undefined;
  let authUserId: string;

  if (role === "student") {
    credential = generateStudentPin();
    const { data: created, error: authError } = await admin.auth.admin.createUser({ email, password: credential, email_confirm: true });
    if (authError || !created.user) {
      return NextResponse.json({ error: authError?.message ?? "Couldn't create the account." }, { status: 500 });
    }
    authUserId = created.user.id;
  } else {
    // Teacher (or another admin): invite by email, no password set here.
    const redirectTo = `${req.nextUrl.origin}/register`;
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (inviteError || !invited.user) {
      return NextResponse.json({ error: inviteError?.message ?? "Couldn't send the invite email." }, { status: 500 });
    }
    authUserId = invited.user.id;
  }

  const { error: profileError } = await admin.from("users").insert({
    id: authUserId,
    role,
    full_name: fullName,
    email,
    admission_number: role === "student" ? admissionNumber || null : null,
    staff_id: role === "teacher" ? staffId || null : null,
    class_id: role === "student" ? classId || null : null,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUserId); // roll back the orphaned auth user
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ id: authUserId, credential, invited: role !== "student" });
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
