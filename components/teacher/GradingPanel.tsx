"use client";

/**
 * GradingPanel — grade one manually-marked answer (fill-blank or short
 * theory). Mount with `key={item.id}` so points/feedback state resets
 * cleanly as the teacher moves through the queue.
 */

import { useState } from "react";
import { X, Loader2, ArrowRight, ChevronRight } from "lucide-react";
import type { GradingItem } from "./types";

interface GradingPanelProps {
  item: GradingItem;
  hasNext: boolean;
  onSave: (pointsAwarded: number, feedback: string) => Promise<void>;
  onSaveAndNext: (pointsAwarded: number, feedback: string) => Promise<void>;
  onClose: () => void;
}

export default function GradingPanel({ item, hasNext, onSave, onSaveAndNext, onClose }: GradingPanelProps) {
  const [points, setPoints] = useState(item.pointsAwarded ?? 0);
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const [saving, setSaving] = useState<"save" | "next" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clamp = (v: number) => Math.max(0, Math.min(item.maxPoints, v));

  const handle = async (mode: "save" | "next") => {
    setError(null);
    setSaving(mode);
    try {
      const clamped = clamp(points);
      if (mode === "save") {
        await onSave(clamped, feedback);
      } else {
        await onSaveAndNext(clamped, feedback);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this grade. Try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-card-hover">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-ink">Grade answer</h2>
            <p className="text-[12px] text-ink/45">{item.studentName}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink/40 hover:bg-background-muted">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink/40">Question</p>
            <p className="text-[13.5px] leading-relaxed text-ink">{item.questionPrompt}</p>
          </div>

          {item.referenceAnswer && (
            <div className="rounded-lg bg-background-muted p-3.5">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink/40">
                {item.questionType === "fill_blank" ? "Expected answer" : "Marking guide"}
              </p>
              <p className="text-[13px] leading-relaxed text-ink/75">{item.referenceAnswer}</p>
            </div>
          )}

          <div className="rounded-lg border border-crimson-100 bg-crimson-50 p-3.5">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-crimson-700/70">Student's answer</p>
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{item.studentAnswerText || "— left blank —"}</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex-1">
              <span className="mb-1 block text-[12px] font-medium text-ink/60">Points awarded (max {item.maxPoints})</span>
              <input
                type="number"
                min={0}
                max={item.maxPoints}
                step={0.5}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-crimson-500"
              />
            </label>
            <input
              type="range"
              min={0}
              max={item.maxPoints}
              step={0.5}
              value={clamp(points)}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="mt-5 flex-1 accent-crimson-600"
            />
          </div>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-ink/60">Feedback to student (optional)</span>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              placeholder="e.g. Good working shown, but the final answer needed simplifying."
              className="w-full resize-none rounded-lg border border-black/10 px-3.5 py-2.5 text-[13px] outline-none focus:border-crimson-500"
            />
          </label>

          {error && <p className="rounded-md bg-crimson-50 px-3 py-2 text-[12.5px] text-crimson-700">{error}</p>}
        </div>

        <div className="flex gap-2.5 border-t border-black/5 px-5 py-4">
          <button
            onClick={() => handle("save")}
            disabled={saving !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/10 py-2.5 text-[13px] font-medium text-ink/70 hover:bg-background-muted disabled:opacity-60"
          >
            {saving === "save" && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
          <button
            onClick={() => handle("next")}
            disabled={saving !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-crimson-600 py-2.5 text-[13px] font-semibold text-white hover:bg-crimson-700 disabled:opacity-70"
          >
            {saving === "next" ? <Loader2 size={14} className="animate-spin" /> : hasNext ? <ArrowRight size={14} /> : <ChevronRight size={14} />}
            {hasNext ? "Save & next" : "Save & finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
