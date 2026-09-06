import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/resolve-student-email
 * body: { studentId: string }
 *
 * Runs before the student is signed in, so RLS (which keys off auth.uid())
 * can't help here — this uses the service-role client instead, and
 * deliberately returns nothing but the email on success, and a generic
 * error on failure, so it can't be used to enumerate valid student IDs
 * or leak anything else about the account.
 */
export async function POST(req: NextRequest) {
  const { studentId } = await req.json();
  if (!studentId?.trim()) {
    return NextResponse.json({ error: "Enter your student ID." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data } = await supabase.from("users").select("email").ilike("admission_number", studentId.trim()).eq("role", "student").maybeSingle();

  if (!data?.email) {
    return NextResponse.json({ error: "We couldn't find that student ID." }, { status: 404 });
  }

  return NextResponse.json({ email: data.email });
}
