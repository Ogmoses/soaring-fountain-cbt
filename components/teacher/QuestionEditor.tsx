"use client";

/**
 * QuestionEditor — create/edit form for a single question.
 *
 * Mount with a `key` tied to the question id (or "new") so internal state
 * initializes fresh per question:
 *   <QuestionEditor key={editing?.id ?? "new"} initial={editing} ... />
 */

import { useState } from "react";
import { Plus, Trash2, ImagePlus, X, Loader2 } from "lucide-react";
import {
  QUESTION_TYPE_LABEL,
  type BankQuestion,
  type QuestionOption,
  type QuestionType,
  type SubjectOption,
} from "./types";

interface QuestionEditorProps {
  initial?: BankQuestion | null;
  subjects: SubjectOption[];
  defaultSubjectId?: string;
  onSave: (question: Omit<BankQuestion, "id" | "updatedAt" | "subjectName"> & { id?: string }) => Promise<void>;
  onCancel: () => void;
}

function newOption(text = ""): QuestionOption {
  return { id: crypto.randomUUID(), text, isCorrect: false };
}

export default function QuestionEditor({ initial, subjects, defaultSubjectId, onSave, onCancel }: QuestionEditorProps) {
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? defaultSubjectId ?? subjects[0]?.id ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [type, setType] = useState<QuestionType>(initial?.type ?? "multiple_choice");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [points, setPoints] = useState(initial?.points ?? 1);
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [options, setOptions] = useState<QuestionOption[]>(
    initial?.options ?? (initial?.type === "true_false"
      ? [{ id: "true", text: "True", isCorrect: false }, { id: "false", text: "False", isCorrect: false }]
      : [newOption(), newOption()])
  );
  const [referenceAnswer, setReferenceAnswer] = useState(initial?.referenceAnswer ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (next: QuestionType) => {
    setType(next);
    if (next === "true_false") {
      setOptions([{ id: "true", text: "True", isCorrect: false }, { id: "false", text: "False", isCorrect: false }]);
    } else if (next === "multiple_choice" && options.length < 2) {
      setOptions([newOption(), newOption()]);
    }
  };

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    // TODO: upload to Supabase Storage and store the returned public URL
    // instead of a data URL, which is only for local preview.
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateOption = (id: string, patch: Partial<QuestionOption>) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const markCorrect = (id: string) => {
    setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === id })));
  };

  const addOption = () => setOptions((prev) => [...prev, newOption()]);
  const removeOption = (id: string) => setOptions((prev) => prev.filter((o) => o.id !== id));

  const validate = (): string | null => {
    if (!subjectId) return "Choose a subject.";
    if (!prompt.trim()) return "Write the question prompt.";
    if (type === "multiple_choice" || type === "true_false") {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) return "Add at least two options.";
      if (!options.some((o) => o.isCorrect)) return "Mark which option is correct.";
    }
    if ((type === "fill_blank" || type === "short_theory") && !referenceAnswer.trim()) {
      return type === "fill_blank" ? "Add the expected answer." : "Add a marking guide for graders.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({
        id: initial?.id,
        subjectId,
        topic: topic.trim(),
        type,
        prompt: prompt.trim(),
        imageUrl,
        points,
        options: type === "multiple_choice" || type === "true_false" ? options.filter((o) => o.text.trim()) : undefined,
        referenceAnswer: type === "fill_blank" || type === "short_theory" ? referenceAnswer.trim() : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the question. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg bg-white shadow-card-hover">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="font-display text-[15px] font-semibold text-ink">{initial ? "Edit question" : "New question"}</h2>
          <button onClick={onCancel} className="rounded-md p-1.5 text-ink/40 hover:bg-background-muted">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink/60">Subject</span>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink/60">Topic</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quadratic equations"
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
              />
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-ink/60">Question type</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`rounded-md px-2.5 py-2 text-[12px] font-medium transition-colors duration-200 ${
                    type === t ? "bg-crimson-600 text-white" : "bg-background-muted text-ink/60 hover:bg-black/5"
                  }`}
                >
                  {QUESTION_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-ink/60">Prompt</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Type the question text"
              className="w-full resize-none rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-ink/60">Diagram (optional)</span>
            {imageUrl ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Question diagram" className="max-h-32 rounded-md border border-black/10" />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-ink/60 shadow-card hover:text-crimson-700"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-black/15 px-3.5 py-2.5 text-[12.5px] font-medium text-ink/50 hover:border-black/25 hover:text-ink/70">
                <ImagePlus size={15} />
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          {(type === "multiple_choice" || type === "true_false") && (
            <div>
              <span className="mb-1.5 block text-[12px] font-medium text-ink/60">Options — select the correct one</span>
              <div className="space-y-2">
                {options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => markCorrect(opt.id)}
                      aria-label="Mark correct"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        opt.isCorrect ? "border-crimson-600 bg-crimson-600" : "border-black/20"
                      }`}
                    >
                      {opt.isCorrect && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </button>
                    <input
                      value={opt.text}
                      onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                      disabled={type === "true_false"}
                      className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-[13px] outline-none focus:border-crimson-500 disabled:bg-background-muted disabled:text-ink/60"
                    />
                    {type === "multiple_choice" && options.length > 2 && (
                      <button onClick={() => removeOption(opt.id)} className="text-ink/30 hover:text-crimson-600">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {type === "multiple_choice" && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-crimson-700 hover:text-crimson-800"
                >
                  <Plus size={14} /> Add option
                </button>
              )}
            </div>
          )}

          {type === "fill_blank" && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink/60">Expected answer (auto-graded, exact match)</span>
              <input
                value={referenceAnswer}
                onChange={(e) => setReferenceAnswer(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
              />
            </label>
          )}

          {type === "short_theory" && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink/60">Marking guide (shown to the grader, not the student)</span>
              <textarea
                value={referenceAnswer}
                onChange={(e) => setReferenceAnswer(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
              />
            </label>
          )}

          <label className="block w-32">
            <span className="mb-1 block text-[12px] font-medium text-ink/60">Points</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
            />
          </label>

          {error && <p className="rounded-md bg-crimson-50 px-3 py-2 text-[12.5px] text-crimson-700">{error}</p>}
        </div>

        <div className="flex gap-2.5 border-t border-black/5 px-5 py-4">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-lg border border-black/10 py-2.5 text-[13px] font-medium text-ink/70 hover:bg-background-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-crimson-600 py-2.5 text-[13px] font-semibold text-white hover:bg-crimson-700 disabled:opacity-70"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : "Save question"}
          </button>
        </div>
      </div>
    </div>
  );
}
