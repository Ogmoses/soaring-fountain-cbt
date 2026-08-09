import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeGradeLetter } from "@/lib/grading";

/**
 * POST /api/student-answers/grade
 * body: { answerId: string, pointsAwarded: number, feedback?: string }
 *
 * Records a teacher's manual mark for one short_theory (or reviewed
 * fill_blank) answer. Once every answer in that session has a score —
 * auto-graded ones already do, from /api/exam-sessions/submit — this
 * rolls the theory score into the exam's `results` row and assigns the
 * final grade letter from `grading_scale`.
 */
export async function POST(req: NextRequest) {
  const { answerId, pointsAwarded, feedback } = await req.json();
  if (!answerId || typeof pointsAwarded !== "number") {
    return NextResponse.json({ error: "answerId and pointsAwarded are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: grader } = await supabase.from("users").select("role").eq("id", auth.user.id).single();
  if (!grader || (grader.role !== "teacher" && grader.role !== "super_admin")) {
    return NextResponse.json({ error: "Only teachers can grade answers." }, { status: 403 });
  }

  const { data: answer } = await supabase.from("student_answers").select("id, session_id").eq("id", answerId).single();
  if (!answer) return NextResponse.json({ error: "Answer not found." }, { status: 404 });

  await supabase
    .from("student_answers")
    .update({ points_awarded: pointsAwarded, feedback: feedback ?? null, graded_by: auth.user.id, graded_at: new Date().toISOString() })
    .eq("id", answerId);

  // ---- Check whether the whole session is now fully graded, and if so, roll up the result ----
  const { data: session } = await supabase.from("student_exam_sessions").select("id, exam_id, student_id").eq("id", answer.session_id).single();
  if (!session) return NextResponse.json({ ok: true, sessionFullyGraded: false });

  const { data: sessionAnswers } = await supabase
    .from("student_answers")
    .select("points_awarded, questions(type, points)")
    .eq("session_id", session.id);

  const stillPending = (sessionAnswers ?? []).some((a) => a.points_awarded === null);
  if (stillPending) return NextResponse.json({ ok: true, sessionFullyGraded: false });

  const theoryScore = (sessionAnswers ?? [])
    .filter((a: any) => a.questions.type === "short_theory")
    .reduce((sum, a) => sum + (a.points_awarded ?? 0), 0);
  const maxScore = (sessionAnswers ?? []).reduce((sum: number, a: any) => sum + a.questions.points, 0);

  const { data: existingResult } = await supabase.from("results").select("objective_score").eq("session_id", session.id).single();
  const objectiveScore = existingResult?.objective_score ?? 0;
  const totalScore = objectiveScore + theoryScore;

  const { data: scaleRows } = await supabase.from("grading_scale").select("min_score, max_score, grade_letter");
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const gradeLetter = computeGradeLetter(percentage, (scaleRows ?? []).map((r) => ({ minScore: r.min_score, maxScore: r.max_score, gradeLetter: r.grade_letter })));

  await supabase.from("results").update({ theory_score: theoryScore, total_score: totalScore, grade_letter: gradeLetter }).eq("session_id", session.id);

  return NextResponse.json({ ok: true, sessionFullyGraded: true, totalScore, maxScore, gradeLetter });
}
