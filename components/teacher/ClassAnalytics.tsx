"use client";

/**
 * ClassAnalytics — performance report for one exam sitting: headline
 * stats, a score-band distribution, which questions students found
 * hardest, and the full per-student breakdown.
 *
 * Pulls from `results` (+ `student_answers` for question-level stats)
 * joined to the class roster in `users`.
 */

export interface ScoreBand {
  label: string; // "0–20", "21–40", ...
  count: number;
}

export interface QuestionDifficulty {
  prompt: string;
  correctPercent: number; // 0-100
}

export interface StudentResultRow {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  grade: string | null;
  rank: number;
}

export interface ClassAnalyticsData {
  examTitle: string;
  subjectName: string;
  className: string;
  totalStudents: number;
  average: number;
  highest: number;
  lowest: number;
  maxScore: number;
  passRate: number; // 0-100
  scoreDistribution: ScoreBand[];
  questionDifficulty: QuestionDifficulty[];
  students: StudentResultRow[];
}

export interface ExamOption {
  id: string;
  title: string;
  subjectName: string;
}

interface ClassAnalyticsProps {
  examOptions: ExamOption[];
  selectedExamId: string;
  onExamChange: (examId: string) => void;
  data: ClassAnalyticsData | null;
}

export default function ClassAnalytics({ examOptions, selectedExamId, onExamChange, data }: ClassAnalyticsProps) {
  return (
    <div className="pb-10">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Class analytics</h1>
          {data && <p className="mt-0.5 text-[13px] text-ink/50">{data.className} · {data.subjectName}</p>}
        </div>
        <select
          value={selectedExamId}
          onChange={(e) => onExamChange(e.target.value)}
          className="rounded-lg border border-black/10 px-3.5 py-2.5 text-[13px] outline-none focus:border-crimson-500"
        >
          {examOptions.map((e) => (
            <option key={e.id} value={e.id}>{e.title} · {e.subjectName}</option>
          ))}
        </select>
      </div>

      {!data ? (
        <div className="rounded-lg border border-dashed border-black/10 bg-white px-4 py-10 text-center text-[13px] text-ink/45">
          No results published for this exam yet.
        </div>
      ) : (
        <>
          {/* ---------- Headline stats ---------- */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Class average" value={`${data.average.toFixed(1)}/${data.maxScore}`} />
            <StatCard label="Highest score" value={`${data.highest}/${data.maxScore}`} tone="success" />
            <StatCard label="Lowest score" value={`${data.lowest}/${data.maxScore}`} tone="warn" />
            <StatCard label="Pass rate" value={`${data.passRate.toFixed(0)}%`} />
          </div>

          {/* ---------- Score distribution ---------- */}
          <SectionCard title="Score distribution" subtitle={`${data.totalStudents} students`} className="mt-5">
            <div className="space-y-2.5">
              {data.scoreDistribution.map((band) => {
                const max = Math.max(...data.scoreDistribution.map((b) => b.count), 1);
                return (
                  <div key={band.label} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-[12px] text-ink/50">{band.label}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-background-muted">
                      <div className="h-full rounded-full bg-crimson-600" style={{ width: `${(band.count / max) * 100}%` }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-[12px] font-medium text-ink/60">{band.count}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* ---------- Hardest questions ---------- */}
          <SectionCard title="Hardest questions" subtitle="Lowest % of students answering correctly" className="mt-5">
            <div className="space-y-2.5">
              {[...data.questionDifficulty]
                .sort((a, b) => a.correctPercent - b.correctPercent)
                .map((q, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex-1 truncate text-[12.5px] text-ink/75">{q.prompt}</span>
                    <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-background-muted">
                      <div
                        className={`h-full rounded-full ${q.correctPercent < 40 ? "bg-crimson-600" : q.correctPercent < 70 ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${q.correctPercent}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[12px] font-medium text-ink/60">{q.correctPercent.toFixed(0)}%</span>
                  </div>
                ))}
            </div>
          </SectionCard>

          {/* ---------- Per-student table ---------- */}
          <SectionCard title="Student results" className="mt-5">
            <div className="divide-y divide-black/5 sm:hidden">
              {data.students.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 shrink-0 text-[12px] font-semibold text-ink/40">#{s.rank}</span>
                    <span className="text-[13px] font-medium text-ink">{s.name}</span>
                  </div>
                  <span className="text-[12.5px] font-semibold tabular-nums text-ink/70">{s.score}/{s.maxScore}</span>
                </div>
              ))}
            </div>
            <table className="hidden w-full text-left sm:table">
              <thead>
                <tr className="border-b border-black/5 text-[11.5px] uppercase tracking-wide text-ink/40">
                  <th className="py-2.5 pr-4 font-medium">Rank</th>
                  <th className="py-2.5 pr-4 font-medium">Student</th>
                  <th className="py-2.5 pr-4 font-medium">Score</th>
                  <th className="py-2.5 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.students.map((s) => (
                  <tr key={s.id} className="text-[13px] text-ink">
                    <td className="py-2.5 pr-4 text-ink/50">#{s.rank}</td>
                    <td className="py-2.5 pr-4 font-medium">{s.name}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{s.score}/{s.maxScore}</td>
                    <td className="py-2.5 text-ink/70">{s.grade ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "success" | "warn" | "default" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warn" ? "text-crimson-600" : "text-ink";
  return (
    <div className="rounded-lg border border-black/5 bg-white p-4 shadow-card">
      <p className={`font-display text-[18px] font-semibold tabular-nums ${toneClass}`}>{value}</p>
      <p className="mt-0.5 text-[11.5px] text-ink/45">{label}</p>
    </div>
  );
}

function SectionCard({ title, subtitle, className, children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border border-black/5 bg-white p-4.5 shadow-card sm:p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h2 className="font-display text-[14px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-[12px] text-ink/45">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
