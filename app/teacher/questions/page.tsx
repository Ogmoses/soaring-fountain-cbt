"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuestionBankManager from "@/components/teacher/QuestionBankManager";
import { createClient } from "@/lib/supabase/client";
import { orThrow } from "@/lib/supabaseErrors";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import type { BankQuestion, SubjectOption } from "@/components/teacher/types";
import PageLoading from "@/components/layout/PageLoading";

export default function TeacherQuestionsPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!authUser) return;

    const [{ data: subjectRows }, { data: questionRows }] = await Promise.all([
      supabase.from("teacher_subjects").select("subjects(id, name)").eq("teacher_id", authUser.id),
      supabase
        .from("questions")
        .select("id, subject_id, topic, type, prompt, image_url, points, reference_answer, updated_at, subjects(name), question_options(id, option_text, is_correct, order_index)")
        .eq("created_by", authUser.id)
        .order("updated_at", { ascending: false }),
    ]);

    const uniqueSubjects = new Map<string, string>();
    for (const row of subjectRows ?? []) {
      const s = (row as any).subjects;
      if (s) uniqueSubjects.set(s.id, s.name);
    }

    if (uniqueSubjects.size === 0) {
      // No teacher_subjects assignments yet (e.g. an admin hasn't set them
      // up) — fall back to every subject rather than leaving the teacher
      // completely unable to create a question.
      const { data: allSubjects } = await supabase.from("subjects").select("id, name").order("name");
      for (const s of allSubjects ?? []) uniqueSubjects.set(s.id, s.name);
    }

    setSubjects([...uniqueSubjects.entries()].map(([id, name]) => ({ id, name })));
    setQuestions(
      (questionRows ?? []).map((q: any) => ({
        id: q.id,
        subjectId: q.subject_id,
        subjectName: q.subjects?.name ?? "",
        topic: q.topic ?? "",
        type: q.type,
        prompt: q.prompt,
        imageUrl: q.image_url,
        points: q.points,
        options: (q.question_options ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((o: any) => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct })),
        referenceAnswer: q.reference_answer,
        updatedAt: q.updated_at,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  const syncOptions = async (questionId: string, options: BankQuestion["options"]) => {
    await orThrow(supabase.from("question_options").delete().eq("question_id", questionId));
    if (options && options.length > 0) {
      await orThrow(
        supabase.from("question_options").insert(
          options.map((o, i) => ({ question_id: questionId, option_text: o.text, is_correct: o.isCorrect, order_index: i }))
        )
      );
    }
  };

  const handleCreate = async (q: Omit<BankQuestion, "id" | "updatedAt" | "subjectName">) => {
    if (!authUser) return;
    const { data: created, error } = await supabase
      .from("questions")
      .insert({
        subject_id: q.subjectId,
        topic: q.topic || null,
        created_by: authUser.id,
        type: q.type,
        prompt: q.prompt,
        image_url: q.imageUrl ?? null, // TODO: upload to Supabase Storage instead of a data: URL
        points: q.points,
        reference_answer: q.referenceAnswer ?? null,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Couldn't save the question.");
    if (q.options) await syncOptions(created.id, q.options);
    await loadAll();
  };

  const handleUpdate = async (id: string, q: Omit<BankQuestion, "id" | "updatedAt" | "subjectName">) => {
    const { error } = await supabase
      .from("questions")
      .update({
        subject_id: q.subjectId,
        topic: q.topic || null,
        type: q.type,
        prompt: q.prompt,
        image_url: q.imageUrl ?? null,
        points: q.points,
        reference_answer: q.referenceAnswer ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await syncOptions(id, q.options);
    await loadAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await loadAll();
  };

  return (
    <DashboardLayout role="teacher" pageTitle="Question Bank" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? <PageLoading /> : (
        <QuestionBankManager subjects={subjects} questions={questions} onCreate={handleCreate} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}
    </DashboardLayout>
  );
}
