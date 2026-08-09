import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AnswersMap } from "@/components/exam/ExamInterface";

/**
 * POST /api/exam-sessions/answers
 * body: { sessionId: string, answers: AnswersMap }
 *
 * Upserts every answer in the map and refreshes the session's heartbeat —
 * this doubles as the "is this session still alive" signal that
 * /api/exam-sessions/start uses to decide whether a stale session on
 * another device can be reclaimed.
 */
export async function POST(req: NextRequest) {
  const { sessionId, answers } = (await req.json()) as { sessionId: string; answers: AnswersMap };
  if (!sessionId || !answers) return NextResponse.json({ error: "sessionId and answers are required." }, { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: session } = await supabase.from("student_exam_sessions").select("id, exam_id, student_id, status").eq("id", sessionId).single();
  if (!session || session.student_id !== auth.user.id) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json({ error: "This exam has already been submitted." }, { status: 409 });
  }

  // Need each question's type to know whether the value is an option id
  // (multiple_choice/true_false) or free text (fill_blank/short_theory).
  const { data: examQuestions } = await supabase.from("exam_questions").select("questions(id, type)").eq("exam_id", session.exam_id);
  const typeByQuestion = new Map((examQuestions ?? []).map((eq: any) => [eq.questions.id, eq.questions.type as string]));

  const rows = Object.entries(answers).map(([questionId, a]) => {
    const isObjective = typeByQuestion.get(questionId) === "multiple_choice" || typeByQuestion.get(questionId) === "true_false";
    return {
      session_id: sessionId,
      question_id: questionId,
      selected_option_id: isObjective ? a.value || null : null,
      free_text_answer: !isObjective ? a.value || null : null,
      is_flagged: a.flagged,
      updated_at: new Date().toISOString(),
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase.from("student_answers").upsert(rows, { onConflict: "session_id,question_id" });
    if (error) return NextResponse.json({ error: "Couldn't save your answers — your local copy is still safe, retrying shortly." }, { status: 500 });
  }

  await supabase.from("student_exam_sessions").update({ last_heartbeat_at: new Date().toISOString() }).eq("id", sessionId);

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
