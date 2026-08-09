"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExamBuilder, { type ExamFormData } from "@/components/teacher/ExamBuilder";
import type { BankQuestion, ClassOption, SubjectOption, TermOption } from "@/components/teacher/types";
// import { createClient } from "@/lib/supabase/client";

// TODO: replace all four with real queries — subjects/classes from
// teacher_subjects, terms from the current academic_session, and the
// question bank from `questions` filtered to this teacher's subjects.
const SUBJECTS: SubjectOption[] = [{ id: "sub-math", name: "Mathematics" }];
const CLASSES: ClassOption[] = [{ id: "cls-jss1", name: "JSS1" }, { id: "cls-jss2", name: "JSS2" }];
const TERMS: TermOption[] = [{ id: "term-2", name: "Second Term" }];
const QUESTION_BANK: BankQuestion[] = [
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
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "q2",
    subjectId: "sub-math",
    subjectName: "Mathematics",
    topic: "Fractions",
    type: "fill_blank",
    prompt: "Simplify 12/16 to its lowest terms.",
    points: 1,
    referenceAnswer: "3/4",
    updatedAt: new Date().toISOString(),
  },
];

export default function TeacherExamBuilderPage() {
  const router = useRouter();

  const persistExam = async (data: ExamFormData, status: "draft" | "published") => {
    // TODO:
    // 1. upsert into `exams` (title, subject_id, class_id, term_id, duration_minutes,
    //    pass_mark, weight_percent, shuffle_*, show_result_instantly, status)
    // 2. replace `exam_questions` rows to match data.questionIds order
    // 3. upsert `exam_batches` from data.batches (convert datetime-local strings
    //    to timestamptz before sending)
    console.log(status, data);
  };

  return (
    <DashboardLayout role="teacher" pageTitle="Exam Builder" userName="Mrs. Adeyemi" onLogout={() => router.push("/login")}>
      <ExamBuilder
        subjects={SUBJECTS}
        classes={CLASSES}
        terms={TERMS}
        questionBank={QUESTION_BANK}
        onSaveDraft={(data) => persistExam(data, "draft")}
        onPublish={(data) => persistExam(data, "published")}
      />
    </DashboardLayout>
  );
}
