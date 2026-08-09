"use client";

/**
 * Student Exam Launchpad
 *
 * The student's home screen: exams they can enter right now (within their
 * assigned batch window), batches coming up later, and past results.
 * Feed it real data from `exam_batches` / `batch_students` / `results`
 * (see database/schema.sql) — the shapes below mirror those tables closely
 * so the swap is mostly a fetch, not a redesign.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronRight,
  CalendarClock,
  CheckCircle2,
  Lock,
  Award,
} from "lucide-react";

export interface AvailableExam {
  examId: string;
  batchId: string;
  title: string;
  subjectName: string;
  durationMinutes: number;
  batchLabel: string;
  batchStartsAt: string; // ISO
  batchEndsAt: string; // ISO
  alreadyInProgress: boolean;
}

export interface UpcomingBatch {
  id: string;
  examTitle: string;
  subjectName: string;
  batchLabel: string;
  startsAt: string; // ISO
}

export interface PastResult {
  id: string;
  examTitle: string;
  subjectName: string;
  termName: string;
  totalScore: number;
  maxScore: number;
  gradeLetter: string | null;
  takenAt: string; // ISO
}

interface ExamLaunchpadProps {
  studentName: string;
  availableExams: AvailableExam[];
  upcomingBatches: UpcomingBatch[];
  pastResults: PastResult[];
}

export default function ExamLaunchpad({ studentName, availableExams, upcomingBatches, pastResults }: ExamLaunchpadProps) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());

  // Refresh "now" periodically so batch windows open/close live on screen,
  // without a full countdown-timer tick (that belongs to ExamInterface).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const firstName = studentName.split(" ")[0];

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-display text-[19px] font-semibold text-ink sm:text-[22px]">Welcome back, {firstName}</h1>
        <p className="mt-0.5 text-[13px] text-ink/50">Here's what's on your CBT schedule today.</p>
      </div>

      {/* ---------- Available Exams ---------- */}
      <Section title="Available exams" subtitle="Enter when your batch window is open">
        {availableExams.length === 0 ? (
          <EmptyState message="No exams are open for you right now. Check Upcoming Batches below." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableExams.map((exam) => (
              <ExamCard key={exam.examId} exam={exam} now={now} onEnter={() => router.push(`/student/exam/${exam.examId}?batch=${exam.batchId}`)} />
            ))}
          </div>
        )}
      </Section>

      {/* ---------- Upcoming Batches ---------- */}
      <Section title="Upcoming batches" subtitle="Exams scheduled for you later">
        {upcomingBatches.length === 0 ? (
          <EmptyState message="Nothing scheduled yet — your teacher will assign your next batch." />
        ) : (
          <div className="divide-y divide-black/5 rounded-lg border border-black/5 bg-white">
            {upcomingBatches.map((b) => (
              <div key={b.id} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cream-100 text-crimson-700">
                  <CalendarClock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{b.examTitle}</p>
                  <p className="truncate text-[12px] text-ink/50">{b.subjectName} · {b.batchLabel}</p>
                </div>
                <p className="shrink-0 text-[12px] font-medium text-ink/60">{formatWhen(b.startsAt, now)}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ---------- Past Results ---------- */}
      <Section title="Past results" subtitle="Published scores from exams you've completed">
        {pastResults.length === 0 ? (
          <EmptyState message="Your results will appear here once a teacher publishes them." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-black/5 bg-white">
            {/* Mobile: stacked cards */}
            <div className="divide-y divide-black/5 sm:hidden">
              {pastResults.map((r) => (
                <div key={r.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-ink">{r.examTitle}</p>
                      <p className="text-[12px] text-ink/50">{r.subjectName} · {r.termName}</p>
                    </div>
                    <ScoreBadge score={r.totalScore} max={r.maxScore} grade={r.gradeLetter} />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <table className="hidden w-full text-left sm:table">
              <thead>
                <tr className="border-b border-black/5 text-[11.5px] uppercase tracking-wide text-ink/40">
                  <th className="px-5 py-3 font-medium">Exam</th>
                  <th className="px-5 py-3 font-medium">Term</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {pastResults.map((r) => (
                  <tr key={r.id} className="text-[13px] text-ink">
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{r.examTitle}</p>
                      <p className="text-[12px] text-ink/45">{r.subjectName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink/60">{r.termName}</td>
                    <td className="px-5 py-3.5 font-medium tabular-nums">
                      {r.totalScore} / {r.maxScore}
                    </td>
                    <td className="px-5 py-3.5">
                      <GradePill grade={r.gradeLetter} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3.5">
        <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
        <p className="text-[12px] text-ink/45">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function ExamCard({ exam, now, onEnter }: { exam: AvailableExam; now: Date; onEnter: () => void }) {
  const startsAt = new Date(exam.batchStartsAt);
  const endsAt = new Date(exam.batchEndsAt);
  const isOpen = now >= startsAt && now <= endsAt;
  const isPast = now > endsAt;

  return (
    <div className="flex flex-col rounded-lg border border-black/5 bg-white p-4.5 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-semibold text-crimson-700">{exam.subjectName}</span>
        <span className="flex items-center gap-1 text-[11.5px] text-ink/45">
          <Clock size={12} /> {exam.durationMinutes} min
        </span>
      </div>

      <p className="text-[14.5px] font-semibold text-ink">{exam.title}</p>
      <p className="mt-0.5 text-[12px] text-ink/50">{exam.batchLabel}</p>

      <div className="mt-4 flex-1" />

      {isPast ? (
        <div className="flex items-center gap-1.5 rounded-md bg-background-muted px-3 py-2 text-[12px] font-medium text-ink/50">
          <Lock size={13} /> Batch window closed
        </div>
      ) : isOpen ? (
        <button
          onClick={onEnter}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-crimson-600 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-crimson-700"
        >
          {exam.alreadyInProgress ? "Resume exam" : "Enter exam"} <ChevronRight size={15} />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 rounded-md bg-background-muted px-3 py-2 text-[12px] font-medium text-ink/50">
          <Clock size={13} /> Opens {formatWhen(exam.batchStartsAt, now)}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score, max, grade }: { score: number; max: number; grade: string | null }) {
  return (
    <div className="flex shrink-0 flex-col items-end">
      <p className="text-[13px] font-semibold tabular-nums text-ink">{score}/{max}</p>
      <GradePill grade={grade} />
    </div>
  );
}

function GradePill({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-[11px] text-ink/40">Pending</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-crimson-50 px-2 py-0.5 text-[11px] font-semibold text-crimson-700">
      <Award size={11} /> {grade}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-black/10 bg-white px-4 py-6 text-[13px] text-ink/45">
      <CheckCircle2 size={16} className="shrink-0 text-ink/25" />
      {message}
    </div>
  );
}

function formatWhen(iso: string, now: Date): string {
  const date = new Date(iso);
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin <= 0) return "now";
  if (diffMin < 60) return `in ${diffMin} min`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `in ${diffHr}h`;

  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
    " · " + date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
