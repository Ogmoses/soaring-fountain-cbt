import { createClient } from "@/lib/supabase/client";

/**
 * Enrolls every active student in `classId` into every batch in
 * `batchIds`. Exam creation/editing was inserting exam_batches without
 * ever populating batch_students, which is the actual access-control
 * table — app/api/exam-sessions/start/route.ts rejects a student with
 * no matching row here, and the student-facing "Upcoming Batches" list
 * reads from it too. So a batch existing was never enough on its own;
 * this is the step that makes it real for students.
 *
 * Known simplification: this enrolls the whole class into EVERY batch
 * given, rather than splitting them across multiple batches (e.g. one
 * lab session for the first half of a large class, another for the
 * second). That's fine for the common case of one batch per exam; if
 * splitting a class across sittings is actually needed, that's a
 * distinct assignment feature, not this one.
 */
export async function enrollClassIntoBatches(classId: string, batchIds: string[]) {
  if (batchIds.length === 0) return;
  const supabase = createClient();

  const { data: students, error: studentsError } = await supabase
    .from("users")
    .select("id")
    .eq("role", "student")
    .eq("class_id", classId)
    .eq("is_active", true);
  if (studentsError) throw new Error(studentsError.message);
  if (!students || students.length === 0) return;

  const rows = batchIds.flatMap((batchId) => students.map((s) => ({ batch_id: batchId, student_id: s.id })));
  const { error } = await supabase.from("batch_students").upsert(rows, { onConflict: "batch_id,student_id" });
  if (error) throw new Error(error.message);
}
