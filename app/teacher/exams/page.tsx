"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExamBuilder, { type ExamFormData } from "@/components/teacher/ExamBuilder";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import type { BankQuestion, ClassOption, SubjectOption, TermOption } from "@/components/teacher/types";

export default function TeacherExamBuilderPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [questionBank, setQuestionBank] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      const [{ data: assignmentRows }, { data: termRows }, { data: questionRows }] = await Promise.all([
        supabase.from("teacher_subjects").select("subjects(id, name), classes(id, name)").eq("teacher_id", authUser.id),
        supabase.from("terms").select("id, name").order("is_current", { ascending: false }),
        supabase
          .from("questions")
          .select("id, subject_id, topic, type, prompt, points, reference_answer, subjects(name)")
          .eq("created_by", authUser.id),
      ]);

      const uniqueSubjects = new Map<string, string>();
      const uniqueClasses = new Map<string, string>();
      for (const row of assignmentRows ?? []) {
        const s = (row as any).subjects;
        const c = (row as any).classes;
        if (s) uniqueSubjects.set(s.id, s.name);
        if (c) uniqueClasses.set(c.id, c.name);
      }

      if (uniqueSubjects.size === 0 || uniqueClasses.size === 0) {
        // No teacher_subjects assignments yet — fall back to everything
        // rather than leaving Exam Builder completely unusable.
        const [{ data: allSubjects }, { data: allClasses }] = await Promise.all([
          supabase.from("subjects").select("id, name").order("name"),
          supabase.from("classes").select("id, name").order("name"),
        ]);
        for (const s of allSubjects ?? []) uniqueSubjects.set(s.id, s.name);
        for (const c of allClasses ?? []) uniqueClasses.set(c.id, c.name);
      }

      setSubjects([...uniqueSubjects.entries()].map(([id, name]) => ({ id, name })));
      setClasses([...uniqueClasses.entries()].map(([id, name]) => ({ id, name })));
      setTerms(termRows ?? []);
      setQuestionBank(
        (questionRows ?? []).map((q: any) => ({
          id: q.id,
          subjectId: q.subject_id,
          subjectName: q.subjects?.name ?? "",
          topic: q.topic ?? "",
          type: q.type,
          prompt: q.prompt,
          points: q.points,
          referenceAnswer: q.reference_answer,
          updatedAt: new Date().toISOString(),
        }))
      );
      setLoading(false);
    })();
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const { error: batchError } = await supabase.from("exam_batches").insert(
        data.batches.map((b) => ({
          exam_id: exam.id,
          label: b.label,
          starts_at: new Date(b.startsAt).toISOString(),
          ends_at: new Date(b.endsAt).toISOString(),
          lab_room: b.labRoom || null,
        }))
      );
      if (batchError) throw new Error(batchError.message);
    }

    router.push("/teacher/exams");
  };

  if (loading) return null; // TODO: swap in a loading skeleton once the design system has one

  return (
    <DashboardLayout role="teacher" pageTitle="Exam Builder" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      <ExamBuilder
        subjects={subjects}
        classes={classes}
        terms={terms}
        questionBank={questionBank}
        onSaveDraft={(data) => persistExam(data, "draft")}
        onPublish={(data) => persistExam(data, "published")}
      />
    </DashboardLayout>
  );
}
