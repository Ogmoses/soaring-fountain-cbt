"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Users, Archive } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExamBuilder, { type ExamFormData } from "@/components/teacher/ExamBuilder";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import { useTeacherExamFormData } from "@/lib/useTeacherExamFormData";
import PageLoading from "@/components/layout/PageLoading";

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const examId = params.id;
  const authUser = useAuthUser();
  const supabase = createClient();
  const { subjects, classes, terms, questionBank, loading: refDataLoading } = useTeacherExamFormData(authUser?.id);

  const [initial, setInitial] = useState<Partial<ExamFormData> | null>(null);
  const [locked, setLocked] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);

  useEffect(() => {
    if (!examId) return;
    (async () => {
      const [{ data: exam, error }, { data: eqRows }, { data: batchRows }] = await Promise.all([
        supabase.from("exams").select("*").eq("id", examId).single(),
        supabase.from("exam_questions").select("question_id, order_index").eq("exam_id", examId).order("order_index"),
        supabase.from("exam_batches").select("id, label, starts_at, ends_at, lab_room").eq("exam_id", examId),
      ]);
      if (error || !exam) {
        setLoadError("Couldn't find that exam.");
        setLoadingExam(false);
        return;
      }

      const batchIds = (batchRows ?? []).map((b) => b.id);
      const [{ count: sessionCount }, { count: resultCount }, { count: batchStudentCount }] = await Promise.all([
        supabase.from("student_exam_sessions").select("id", { count: "exact", head: true }).eq("exam_id", examId),
        supabase.from("results").select("id", { count: "exact", head: true }).eq("exam_id", examId),
        batchIds.length > 0
          ? supabase.from("batch_students").select("id", { count: "exact", head: true }).in("batch_id", batchIds)
          : Promise.resolve({ count: 0 }),
      ]);
      // Once any of these exist, questions/batches/timing are effectively
      // load-bearing for real student data — editing them in place (which
      // means deleting and re-inserting exam_questions/exam_batches rows)
      // would cascade away sessions, results, or batch assignments that
      // already depend on the old rows. Archiving is the safe path instead
      // of allowing a structural edit here.
      const hasActivity = (sessionCount ?? 0) > 0 || (resultCount ?? 0) > 0 || (batchStudentCount ?? 0) > 0;
      setLocked(hasActivity);

      setInitial({
        title: exam.title,
        subjectId: exam.subject_id,
        classId: exam.class_id,
        termId: exam.term_id,
        durationMinutes: exam.duration_minutes,
        passMark: exam.pass_mark,
        weightPercent: exam.weight_percent,
        shuffleQuestions: exam.shuffle_questions,
        shuffleOptions: exam.shuffle_options,
        showResultInstantly: exam.show_result_instantly,
        isTerminal: exam.is_terminal,
        questionIds: (eqRows ?? []).map((r) => r.question_id),
        batches: (batchRows ?? []).map((b) => ({
          id: b.id,
          label: b.label,
          startsAt: b.starts_at,
          endsAt: b.ends_at,
          labRoom: b.lab_room ?? undefined,
        })),
      });
      setLoadingExam(false);
    })();
  }, [examId]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistExam = async (data: ExamFormData, status: "draft" | "published") => {
    const { error: examError } = await supabase
      .from("exams")
      .update({
        title: data.title,
        subject_id: data.subjectId,
        class_id: data.classId,
        term_id: data.termId,
        duration_minutes: data.durationMinutes,
        pass_mark: data.passMark,
        weight_percent: data.weightPercent,
        is_terminal: data.isTerminal,
        shuffle_questions: data.shuffleQuestions,
        shuffle_options: data.shuffleOptions,
        show_result_instantly: data.showResultInstantly,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", examId);
    if (examError) throw new Error(examError.message);

    // Replacing wholesale is only reached when locked === false, i.e. we've
    // already confirmed nothing depends on the existing rows yet.
    await supabase.from("exam_questions").delete().eq("exam_id", examId);
    if (data.questionIds.length > 0) {
      const { error } = await supabase
        .from("exam_questions")
        .insert(data.questionIds.map((questionId, i) => ({ exam_id: examId, question_id: questionId, order_index: i })));
      if (error) throw new Error(error.message);
    }

    await supabase.from("exam_batches").delete().eq("exam_id", examId);
    if (data.batches.length > 0) {
      const { error } = await supabase.from("exam_batches").insert(
        data.batches.map((b) => ({
          exam_id: examId,
          label: b.label,
          starts_at: new Date(b.startsAt).toISOString(),
          ends_at: new Date(b.endsAt).toISOString(),
          lab_room: b.labRoom || null,
        }))
      );
      if (error) throw new Error(error.message);
    }

    if (status === "published") {
      setTimeout(() => router.push("/teacher/exams"), 1400);
    } else {
      router.push("/teacher/exams");
    }
  };

  const loading = refDataLoading || loadingExam;

  return (
    <DashboardLayout role="teacher" pageTitle="Edit exam" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? (
        <PageLoading />
      ) : loadError ? (
        <p className="py-10 text-center text-[13px] text-ink/50">{loadError}</p>
      ) : locked ? (
        <div className="mx-auto mt-4 max-w-md rounded-lg border border-warning/30 bg-warning/10 p-5 text-center">
          <AlertTriangle size={22} className="mx-auto text-warning" />
          <h1 className="mt-2 font-display text-[15px] font-semibold text-ink">This exam can't be edited directly</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">
            Students have already been assigned to it, started it, or finished it, so changing its questions or schedule now could disrupt or lose their work. View who's involved, or archive it and build a fresh copy instead.
          </p>
          <div className="mt-4 flex justify-center gap-2.5">
            <Link
              href="/teacher/exams"
              className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3.5 py-2 text-[13px] font-medium text-ink/70 hover:bg-background-muted"
            >
              <Users size={14} /> Back to My Exams
            </Link>
          </div>
        </div>
      ) : (
        <ExamBuilder
          subjects={subjects}
          classes={classes}
          terms={terms}
          questionBank={questionBank}
          initial={initial ?? undefined}
          onSaveDraft={(data) => persistExam(data, "draft")}
          onPublish={(data) => persistExam(data, "published")}
        />
      )}
    </DashboardLayout>
  );
}
