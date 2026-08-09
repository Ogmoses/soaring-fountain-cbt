// Shared shapes for the Teacher portal. These mirror `database/schema.sql`
// closely (questions, question_options, exams, exam_batches) so wiring real
// Supabase queries later is mostly a fetch + rename, not a redesign.

export type QuestionType = "multiple_choice" | "true_false" | "fill_blank" | "short_theory";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface BankQuestion {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  type: QuestionType;
  prompt: string;
  imageUrl?: string | null;
  points: number;
  options?: QuestionOption[]; // multiple_choice / true_false
  referenceAnswer?: string | null; // fill_blank / short_theory marking guide
  updatedAt: string; // ISO
}

export interface SubjectOption {
  id: string;
  name: string;
}

export interface ClassOption {
  id: string;
  name: string;
}

export interface TermOption {
  id: string;
  name: string;
}

export interface GradingItem {
  id: string; // student_answers.id
  studentName: string;
  questionType: "fill_blank" | "short_theory";
  questionPrompt: string;
  referenceAnswer: string | null; // marking guide / expected answer
  studentAnswerText: string;
  maxPoints: number;
  pointsAwarded: number | null; // null = not yet graded
  feedback?: string;
}

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / False",
  fill_blank: "Fill in the blank",
  short_theory: "Short theory",
};
