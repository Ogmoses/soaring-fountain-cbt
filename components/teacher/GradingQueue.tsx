"use client";

/**
 * GradingQueue — list of theory/fill-blank answers awaiting manual marking
 * for a chosen exam, with a modal panel (GradingPanel) to grade each one
 * and move through the queue without returning to the list every time.
 */

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import GradingPanel from "./GradingPanel";
import type { GradingItem } from "./types";

export interface ExamOption {
  id: string;
  title: string;
  subjectName: string;
}

interface GradingQueueProps {
  examOptions: ExamOption[];
  selectedExamId: string;
  onExamChange: (examId: string) => void;
  items: GradingItem[];
  onGrade: (itemId: string, pointsAwarded: number, feedback: string) => Promise<void>;
}

export default function GradingQueue({ examOptions, selectedExamId, onExamChange, items, onGrade }: GradingQueueProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const pendingIds = useMemo(() => items.filter((i) => i.pointsAwarded === null).map((i) => i.id), [items]);
  const gradedCount = items.length - pendingIds.length;
  const activeItem = items.find((i) => i.id === activeId) ?? null;

  const nextPendingId = (currentId: string): string | null => {
    const idx = pendingIds.indexOf(currentId);
    if (idx === -1) return pendingIds[0] ?? null;
    return pendingIds[idx + 1] ?? pendingIds.find((id) => id !== currentId) ?? null;
  };

  const handleSave = async (itemId: string, points: number, feedback: string) => {
    await onGrade(itemId, points, feedback);
  };

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Grading queue</h1>
          <p className="mt-0.5 text-[13px] text-ink/50">
            {items.length === 0 ? "No manually-marked answers for this exam." : `${gradedCount} of ${items.length} graded`}
          </p>
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

      {items.length > 0 && (
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-background-muted">
          <div className="h-full rounded-full bg-crimson-600 transition-all duration-300" style={{ width: `${(gradedCount / items.length) * 100}%` }} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/10 bg-white px-4 py-10 text-center text-[13px] text-ink/45">
          Nothing to grade here yet — objective questions are marked automatically.
        </div>
      ) : (
        <div className="divide-y divide-black/5 rounded-lg border border-black/5 bg-white">
          {items.map((item) => {
            const graded = item.pointsAwarded !== null;
            return (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                className="flex w-full items-start gap-3.5 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-background-muted sm:px-5"
              >
                {graded ? (
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <Circle size={17} className="mt-0.5 shrink-0 text-ink/25" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{item.studentName}</p>
                  <p className="truncate text-[12.5px] text-ink/50">{item.questionPrompt}</p>
                </div>
                <span className={`shrink-0 text-[12px] font-semibold tabular-nums ${graded ? "text-ink/60" : "text-ink/30"}`}>
                  {graded ? `${item.pointsAwarded}/${item.maxPoints}` : `— /${item.maxPoints}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {items.length > 0 && pendingIds.length > 0 && !activeId && (
        <button
          onClick={() => setActiveId(pendingIds[0])}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-crimson-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-crimson-700"
        >
          <ClipboardCheck size={15} /> Start grading ({pendingIds.length} left)
        </button>
      )}

      {activeItem && (
        <GradingPanel
          key={activeItem.id}
          item={activeItem}
          hasNext={pendingIds.some((id) => id !== activeItem.id)}
          onSave={(points, feedback) => handleSave(activeItem.id, points, feedback)}
          onSaveAndNext={async (points, feedback) => {
            await handleSave(activeItem.id, points, feedback);
            setActiveId(nextPendingId(activeItem.id));
          }}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}
