"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExamBuilder, { type ExamFormData } from "@/components/teacher/ExamBuilder";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import { useTeacherExamFormData } from "@/lib/useTeacherExamFormData";
import { enrollClassIntoBatches } from "@/lib/enrollBatchStudents";
import PageLoading from "@/components/layout/PageLoading";

export default function NewExamPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();
  const { subjects, classes, terms, questionBank, loading } = useTeacherExamFormData(authUser?.id);

  const persistExam = async (data: ExamFormData, status: "draft" | "published") => {
    if (!authUser) return;

    const { data: exam, error: examError } = await supabase
      .from("exams")
      .insert({
        title: data.title,
        subject_id: data.subjectId,
        class_id: data.classId,
        term_id: data.termId,
        created_by: authUser.id,
        duration_minutes: data.durationMinutes,
        pass_mark: data.passMark,
        weight_percent: data.weightPercent,
        is_terminal: data.isTerminal,
        shuffle_questions: data.shuffleQuestions,
        shuffle_options: data.shuffleOptions,
        show_result_instantly: data.showResultInstantly,
        status,
      })
      .select("id")
      .single();
    if (examError || !exam) throw new Error(examError?.message ?? "Couldn't save the exam.");

    if (data.questionIds.length > 0) {
      const { error: eqError } = await supabase
        .from("exam_questions")
        .insert(data.questionIds.map((questionId, i) => ({ exam_id: exam.id, question_id: questionId, order_index: i })));
      if (eqError) throw new Error(eqError.message);
    }

    if (data.batches.length > 0) {
      const { data: insertedBatches, error: batchError } = await supabase
        .from("exam_batches")
        .insert(
          data.batches.map((b) => ({
            exam_id: exam.id,
            label: b.label,
            starts_at: new Date(b.startsAt).toISOString(),
            ends_at: new Date(b.endsAt).toISOString(),
            lab_room: b.labRoom || null,
          }))
        )
        .select("id");
      if (batchError) throw new Error(batchError.message);
      await enrollClassIntoBatches(data.classId, (insertedBatches ?? []).map((b) => b.id));
    }

    // Publishing shows its own toast inside ExamBuilder before this fires;
    // a draft save has no equivalent affirmation, so it goes straight back
    // rather than lingering with no feedback either way.
    if (status === "published") {
      setTimeout(() => router.push("/teacher/exams"), 1400);
    } else {
      router.push("/teacher/exams");
    }
  };

  return (
    <DashboardLayout role="teacher" pageTitle="New exam" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? <PageLoading /> : (
        <ExamBuilder
          subjects={subjects}
          classes={classes}
          terms={terms}
          questionBank={questionBank}
          onSaveDraft={(data) => persistExam(data, "draft")}
          onPublish={(data) => persistExam(data, "published")}
        />
      )}
    </DashboardLayout>
  );
}
