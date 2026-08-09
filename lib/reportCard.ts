import type { SupabaseClient } from "@supabase/supabase-js";
import { computeGradeLetter, computeTermSubjectRollup, type WeightedExamScore } from "./grading";
import type { ReportCardData, ReportCardSubjectRow } from "@/components/reports/types";

/**
 * TODO: there's no `school_profile` table yet (see database/schema.sql
 * notes) — swap this for a real fetch once one exists. Until then this is
 * the one hardcoded piece of an otherwise fully data-driven report card.
 */
const SCHOOL_PROFILE_FALLBACK = {
  schoolName: "Soaring Fountain Group of Schools",
  schoolMotto: "Knowledge, Character, Excellence",
  schoolAddress: "",
  logoUrl: null as string | null,
};

interface ExamMeta {
  id: string;
  subjectId: string;
  subjectName: string;
  weightPercent: number;
  isTerminal: boolean;
}

/** Sum of a question bank's points for one exam — `exams` doesn't cache a max_score column. */
export async function fetchExamMaxScores(supabase: SupabaseClient, examIds: string[]): Promise<Map<string, number>> {
  if (examIds.length === 0) return new Map();
  const { data } = await supabase.from("exam_questions").select("exam_id, questions(points)").in("exam_id", examIds);
  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const points = (row as any).questions.points as number;
    totals.set(row.exam_id, (totals.get(row.exam_id) ?? 0) + points);
  }
  return totals;
}

/**
 * Builds every subject's CA/Terminal/Total rollup for every student in a
 * class+term in one pass, so ranking (which needs everyone's total) and
 * this one student's report card share the same underlying computation.
 */
async function computeClassRollups(supabase: SupabaseClient, classId: string, termId: string) {
  const { data: rows } = await supabase
    .from("results")
    .select("student_id, total_score, exams!inner(id, subject_id, class_id, term_id, weight_percent, is_terminal, subjects(name))")
    .eq("exams.term_id", termId)
    .eq("exams.class_id", classId)
    .eq("published", true);

  const examIds = [...new Set((rows ?? []).map((r: any) => r.exams.id as string))];
  const maxScores = await fetchExamMaxScores(supabase, examIds);

  // studentId -> subjectId -> weighted exam scores contributing to that subject
  const byStudentSubject = new Map<string, Map<string, { name: string; scores: (WeightedExamScore & { isTerminal: boolean })[] }>>();

  for (const row of rows ?? []) {
    const exam = (row as any).exams as ExamMeta & { subjects: { name: string } };
    const studentMap = byStudentSubject.get(row.student_id) ?? new Map();
    const subjectEntry = studentMap.get(exam.subject_id) ?? { name: exam.subjects.name, scores: [] };
    subjectEntry.scores.push({
      examId: exam.id,
      totalScore: row.total_score,
      maxScore: maxScores.get(exam.id) ?? 1,
      weightPercent: exam.weight_percent,
      isTerminal: exam.is_terminal,
    });
    studentMap.set(exam.subject_id, subjectEntry);
    byStudentSubject.set(row.student_id, studentMap);
  }

  // studentId -> { subjects: ReportCardSubjectRow[], overallPercent }
  const perStudent = new Map<string, { subjects: ReportCardSubjectRow[]; overallPercent: number }>();
  for (const [studentId, subjectMap] of byStudentSubject) {
    const subjectRows: ReportCardSubjectRow[] = [];
    for (const { name, scores } of subjectMap.values()) {
      const { caScore, terminalScore, totalScore } = computeTermSubjectRollup(scores);
      subjectRows.push({ subjectName: name, caScore, terminalScore, totalScore, maxScore: 100, gradeLetter: null, remark: null });
    }
    const overallPercent = subjectRows.length ? subjectRows.reduce((s, r) => s + r.totalScore, 0) / subjectRows.length : 0;
    perStudent.set(studentId, { subjects: subjectRows, overallPercent });
  }

  return perStudent;
}

export async function buildReportCardData(
  supabase: SupabaseClient,
  studentId: string,
  termId: string,
  opts: { teacherComment?: string; principalName?: string } = {}
): Promise<ReportCardData> {
  const { data: student } = await supabase.from("users").select("full_name, admission_number, class_id, photo_url").eq("id", studentId).single();
  if (!student || !student.class_id) throw new Error("Student not found or has no class assigned.");

  const { data: klass } = await supabase.from("classes").select("id, name").eq("id", student.class_id).single();
  const { data: term } = await supabase.from("terms").select("name, academic_session_id").eq("id", termId).single();
  const { data: session } = term ? await supabase.from("academic_sessions").select("name").eq("id", term.academic_session_id).single() : { data: null };

  const { data: scaleRows } = await supabase.from("grading_scale").select("min_score, max_score, grade_letter, remark");
  const scale = (scaleRows ?? []).map((r) => ({ minScore: r.min_score, maxScore: r.max_score, gradeLetter: r.grade_letter }));
  const remarkByGrade = new Map((scaleRows ?? []).map((r) => [r.grade_letter, r.remark as string | null]));

  const perStudent = await computeClassRollups(supabase, klass!.id, termId);
  const thisStudent = perStudent.get(studentId) ?? { subjects: [], overallPercent: 0 };

  const subjects = thisStudent.subjects
    .map((s) => ({ ...s, gradeLetter: computeGradeLetter(s.totalScore, scale), remark: remarkByGrade.get(computeGradeLetter(s.totalScore, scale) ?? "") ?? null }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  const ranked = [...perStudent.entries()].sort((a, b) => b[1].overallPercent - a[1].overallPercent);
  const positionInClass = ranked.findIndex(([id]) => id === studentId) + 1;

  return {
    ...SCHOOL_PROFILE_FALLBACK,
    studentName: student.full_name,
    admissionNumber: student.admission_number ?? "",
    className: klass?.name ?? "",
    studentPhotoUrl: student.photo_url,
    termName: term?.name ?? "",
    sessionName: (session as any)?.name ?? "",
    subjects,
    overallTotal: thisStudent.overallPercent,
    overallMaxTotal: 100,
    overallGradeLetter: computeGradeLetter(thisStudent.overallPercent, scale),
    positionInClass: positionInClass || perStudent.size,
    classSize: perStudent.size,
    teacherComment: opts.teacherComment ?? "",
    principalName: opts.principalName,
  };
}
