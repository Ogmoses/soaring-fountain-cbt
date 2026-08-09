"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuestionBankManager from "@/components/teacher/QuestionBankManager";
import type { BankQuestion, SubjectOption } from "@/components/teacher/types";
// import { createClient } from "@/lib/supabase/client";

// TODO: replace with the subjects this teacher is assigned to
// (join teacher_subjects → subjects, filtered to auth.uid()).
const SUBJECTS: SubjectOption[] = [
  { id: "sub-math", name: "Mathematics" },
  { id: "sub-eng", name: "English Language" },
];

const INITIAL_QUESTIONS: BankQuestion[] = [
  {
    id: "q1",
    subjectId: "sub-math",
    subjectName: "Mathematics",
    topic: "Quadratic equations",
    type: "multiple_choice",
    prompt: "What are the roots of x² − 5x + 6 = 0?",
    points: 2,
    options: [
      { id: "o1", text: "2 and 3", isCorrect: true },
      { id: "o2", text: "1 and 6", isCorrect: false },
      { id: "o3", text: "-2 and -3", isCorrect: false },
    ],
    updatedAt: new Date().toISOString(),
  },
];

export default function TeacherQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<BankQuestion[]>(INITIAL_QUESTIONS);

  const handleCreate = async (q: Omit<BankQuestion, "id" | "updatedAt" | "subjectName">) => {
    // TODO: const { data, error } = await supabase.from("questions").insert({...}).select().single();
    // then insert into question_options if MCQ/true_false.
    const subjectName = SUBJECTS.find((s) => s.id === q.subjectId)?.name ?? "";
    setQuestions((prev) => [{ ...q, id: crypto.randomUUID(), subjectName, updatedAt: new Date().toISOString() }, ...prev]);
  };

  const handleUpdate = async (id: string, q: Omit<BankQuestion, "id" | "updatedAt" | "subjectName">) => {
    // TODO: await supabase.from("questions").update({...}).eq("id", id); sync question_options.
    const subjectName = SUBJECTS.find((s) => s.id === q.subjectId)?.name ?? "";
    setQuestions((prev) => prev.map((existing) => (existing.id === id ? { ...q, id, subjectName, updatedAt: new Date().toISOString() } : existing)));
  };

  const handleDelete = async (id: string) => {
    // TODO: await supabase.from("questions").delete().eq("id", id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <DashboardLayout role="teacher" pageTitle="Question Bank" userName="Mrs. Adeyemi" onLogout={() => router.push("/login")}>
      <QuestionBankManager subjects={SUBJECTS} questions={questions} onCreate={handleCreate} onUpdate={handleUpdate} onDelete={handleDelete} />
    </DashboardLayout>
  );
}
