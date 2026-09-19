"use client";

/**
 * ExamReview — a student's own view of a finished exam: what they
 * answered, what was correct, and how many points each question earned.
 * Only ever shown when the teacher has turned on `exams.allow_review` and
 * every sitting of the exam has ended (see app/api/exam-sessions/review).
 */

import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

export interface ReviewQuestion {
  questionId: string;
  type: "multiple_choice" | "true_false" | "fill_blank" | "short_theory";
  prompt: string;
  maxPoints: number;
  pointsAwarded: number | null;
  options?: { id: string; text: string; isCorrect: boolean }[];
  selectedOptionId?: string | null;
  referenceAnswer?: string | null;
  freeTextAnswer?: string | null;
}

function correctness(q: ReviewQuestion): "correct" | "incorrect" | "partial" | "ungraded" {
  if (q.type === "multiple_choice" || q.type === "true_false") {
    if (q.selectedOptionId == null) return "incorrect";
    const chosen = q.options?.find((o) => o.id === q.selectedOptionId);
    return chosen?.isCorrect ? "correct" : "incorrect";
  }
  if (q.pointsAwarded == null) return "ungraded";
  if (q.pointsAwarded <= 0) return "incorrect";
  if (q.pointsAwarded >= q.maxPoints) return "correct";
  return "partial";
}

const CORRECTNESS_META = {
  correct: { icon: CheckCircle2, color: "text-success", label: "Correct" },
  incorrect: { icon: XCircle, color: "text-crimson-600", label: "Incorrect" },
  partial: { icon: HelpCircle, color: "text-warning", label: "Partial credit" },
  ungraded: { icon: HelpCircle, color: "text-ink/35", label: "Awaiting grading" },
};

export default function ExamReview({
  examTitle,
  totalScore,
  maxScore,
  questions,
}: {
  examTitle: string;
  totalScore: number;
  maxScore: number;
  questions: ReviewQuestion[];
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-[18px] font-semibold text-ink">{examTitle}</h1>
      <p className="mt-1 text-[13px] text-ink/50">Your score: {totalScore}/{maxScore}</p>

      <div className="mt-5 space-y-3">
        {questions.map((q, i) => {
          const state = correctness(q);
          const meta = CORRECTNESS_META[state];
          const Icon = meta.icon;
          return (
            <div key={q.questionId} className="rounded-lg border border-black/10 bg-white p-3.5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink/40">Question {i + 1}</p>
                <span className={`flex items-center gap-1 text-[11.5px] font-medium ${meta.color}`}>
                  <Icon size={13} /> {meta.label}
                </span>
              </div>

              <p className="mb-2.5 text-[13.5px] leading-relaxed text-ink">{q.prompt}</p>

              {(q.type === "multiple_choice" || q.type === "true_false") && q.options ? (
                <div className="space-y-1.5">
                  {q.options.map((opt) => {
                    const isSelected = opt.id === q.selectedOptionId;
                    return (
                      <div
                        key={opt.id}
                        className={`rounded-md border px-3 py-1.5 text-[12.5px] ${
                          opt.isCorrect
                            ? "border-success/40 bg-success/10 text-ink"
                            : isSelected
                            ? "border-crimson-300 bg-crimson-50 text-crimson-800"
                            : "border-black/10 text-ink/60"
                        }`}
                      >
                        {opt.text}
                        {opt.isCorrect && <span className="ml-1.5 text-[11px] font-medium text-success">(correct answer)</span>}
                        {isSelected && !opt.isCorrect && <span className="ml-1.5 text-[11px] font-medium text-crimson-600">(your answer)</span>}
                        {isSelected && opt.isCorrect && <span className="ml-1.5 text-[11px] font-medium text-success">(your answer)</span>}
                      </div>
                    );
                  })}
                  {q.selectedOptionId == null && <p className="text-[12px] italic text-ink/40">You left this blank.</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-md bg-crimson-50 px-3 py-2 text-[12.5px] text-ink">
                    <span className="mr-1.5 text-[11px] font-medium uppercase tracking-wide text-crimson-700/70">Your answer</span>
                    <p className="whitespace-pre-wrap">{q.freeTextAnswer?.trim() || "— left blank —"}</p>
                  </div>
                  {q.referenceAnswer && (
                    <div className="rounded-md bg-background-muted px-3 py-2 text-[12.5px] text-ink/75">
                      <span className="mr-1.5 text-[11px] font-medium uppercase tracking-wide text-ink/40">
                        {q.type === "fill_blank" ? "Expected answer" : "Marking guide"}
                      </span>
                      <p className="whitespace-pre-wrap">{q.referenceAnswer}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-2 text-right text-[12px] font-medium tabular-nums text-ink/50">
                {q.pointsAwarded ?? 0}/{q.maxPoints} pts
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
