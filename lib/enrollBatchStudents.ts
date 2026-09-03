import { createClient } from "@/lib/supabase/client";

/**
 * Enrolls specific students into specific batches, per an explicit
 * studentId -> batchId assignment map (real, already-inserted batch
 * ids — not ExamBuilder's client-side draft ids). This is what makes a
 * batch real for a student: app/api/exam-sessions/start/route.ts
 * rejects anyone without a matching batch_students row, and the
 * student-facing "Upcoming Batches" list reads from it too.
 *
 * Replaces the earlier whole-class-into-every-batch approach now that
 * ExamBuilder collects a real per-student assignment (auto-split evenly
 * by default, freely overridable) — a single batch naturally ends up
 * with everyone in it either way, since the auto-split puts all of a
 * one-batch roster in the same place.
 */
export async function enrollAssignedStudents(assignments: Record<string, string>) {
  const entries = Object.entries(assignments);
  if (entries.length === 0) return;
  const supabase = createClient();
  const rows = entries.map(([studentId, batchId]) => ({ batch_id: batchId, student_id: studentId }));
  const { error } = await supabase.from("batch_students").upsert(rows, { onConflict: "batch_id,student_id" });
  if (error) throw new Error(error.message);
}
