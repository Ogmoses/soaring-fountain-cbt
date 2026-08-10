"use client";

/**
 * ExamBuilder — configure an exam's rules, pick its questions from the
 * bank, and schedule one or more lab batches for it.
 *
 * Maps directly onto `exams`, `exam_questions`, and `exam_batches` in
 * database/schema.sql: saving should upsert an `exams` row, replace its
 * `exam_questions` rows in the chosen order, and upsert `exam_batches`.
 */

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  CalendarClock,
  Loader2,
  Shuffle,
  Eye,
  Trophy,
} from "lucide-react";
import type { BankQuestion, ClassOption, SubjectOption, TermOption } from "./types";

export interface ExamBatchDraft {
  id: string;
  label: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  labRoom?: string;
}

export interface ExamFormData {
  title: string;
  subjectId: string;
  classId: string;
  termId: string;
  durationMinutes: number;
  passMark: number;
  weightPercent: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultInstantly: boolean;
  /** True for the term's single Terminal Exam; false for CA/CBT-style contributors. Drives the report card's CA-vs-Terminal split. */
  isTerminal: boolean;
  questionIds: string[];
  batches: ExamBatchDraft[];
}

interface ExamBuilderProps {
  subjects: SubjectOption[];
  classes: ClassOption[];
  terms: TermOption[];
  questionBank: BankQuestion[];
  initial?: Partial<ExamFormData>;
  onSaveDraft: (data: ExamFormData) => Promise<void>;
  onPublish: (data: ExamFormData) => Promise<void>;
}

const DEFAULTS: ExamFormData = {
  title: "",
  subjectId: "",
  classId: "",
  termId: "",
  durationMinutes: 45,
  passMark: 50,
  weightPercent: 30,
  shuffleQuestions: true,
  shuffleOptions: true,
  showResultInstantly: false,
  isTerminal: false,
  questionIds: [],
  batches: [],
};

export default function ExamBuilder({ subjects, classes, terms, questionBank, initial, onSaveDraft, onPublish }: ExamBuilderProps) {
  const [form, setForm] = useState<ExamFormData>({
    ...DEFAULTS,
    subjectId: subjects[0]?.id ?? "",
    classId: classes[0]?.id ?? "",
    termId: terms[0]?.id ?? "",
    ...initial,
  });
  const [questionSearch, setQuestionSearch] = useState("");
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ExamFormData>(key: K, value: ExamFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const availableQuestions = useMemo(
    () =>
      questionBank.filter(
        (q) =>
          q.subjectId === form.subjectId &&
          !form.questionIds.includes(q.id) &&
          (questionSearch.trim() === "" || q.prompt.toLowerCase().includes(questionSearch.trim().toLowerCase()))
      ),
    [questionBank, form.subjectId, form.questionIds, questionSearch]
  );

  const selectedQuestions = useMemo(
    () => form.questionIds.map((id) => questionBank.find((q) => q.id === id)).filter((q): q is BankQuestion => !!q),
    [form.questionIds, questionBank]
  );

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  const addQuestion = (id: string) => update("questionIds", [...form.questionIds, id]);
  const removeQuestion = (id: string) => update("questionIds", form.questionIds.filter((qid) => qid !== id));
  const moveQuestion = (index: number, dir: -1 | 1) => {
    const next = [...form.questionIds];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update("questionIds", next);
  };

  const addBatch = () => {
    update("batches", [
      ...form.batches,
      { id: crypto.randomUUID(), label: `Batch ${String.fromCharCode(65 + form.batches.length)}`, startsAt: "", endsAt: "", labRoom: "" },
    ]);
  };
  const updateBatch = (id: string, patch: Partial<ExamBatchDraft>) =>
    update("batches", form.batches.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeBatch = (id: string) => update("batches", form.batches.filter((b) => b.id !== id));

  const validate = (): string | null => {
    if (!form.title.trim()) return "Give the exam a title.";
    if (form.questionIds.length === 0) return "Add at least one question.";
    if (form.batches.length === 0) return "Schedule at least one batch.";
    if (form.batches.some((b) => !b.startsAt || !b.endsAt)) return "Every batch needs a start and end time.";
    return null;
  };

  const handleSave = async (mode: "draft" | "publish") => {
    if (mode === "publish") {
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setError(null);
    setSaving(mode);
    try {
      await (mode === "draft" ? onSaveDraft(form) : onPublish(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the exam. Try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="pb-10">
      <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Exam builder</h1>
      <p className="mt-0.5 text-[13px] text-ink/50">Set the rules, pick questions, then schedule lab batches.</p>

      {/* ---------- Details ---------- */}
      <SectionCard title="Details" className="mt-5">
        <label className="mb-3.5 block">
          <span className="mb-1 block text-[12px] font-medium text-ink/60">Exam title</span>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Second Term Mid-Term Test"
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-crimson-500"
          />
        </label>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <Select label="Subject" value={form.subjectId} onChange={(v) => update("subjectId", v)} options={subjects} />
          <Select label="Class" value={form.classId} onChange={(v) => update("classId", v)} options={classes} />
          <Select label="Term" value={form.termId} onChange={(v) => update("termId", v)} options={terms} />
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-3.5">
          <NumberField label="Duration (min)" value={form.durationMinutes} onChange={(v) => update("durationMinutes", v)} />
          <NumberField label="Pass mark" value={form.passMark} onChange={(v) => update("passMark", v)} />
          <NumberField label="Weight (%)" value={form.weightPercent} onChange={(v) => update("weightPercent", v)} hint="of term grade" />
        </div>

        <div className="mt-4 space-y-2.5">
          <Toggle icon={Shuffle} label="Shuffle question order per student" checked={form.shuffleQuestions} onChange={(v) => update("shuffleQuestions", v)} />
          <Toggle icon={Shuffle} label="Shuffle option order per student" checked={form.shuffleOptions} onChange={(v) => update("shuffleOptions", v)} />
          <Toggle icon={Eye} label="Show result instantly after submission" checked={form.showResultInstantly} onChange={(v) => update("showResultInstantly", v)} />
          <Toggle icon={Trophy} label="This is the term's Terminal Exam (not a CA/CBT)" checked={form.isTerminal} onChange={(v) => update("isTerminal", v)} />
        </div>
      </SectionCard>

      {/* ---------- Questions ---------- */}
      <SectionCard title="Questions" subtitle={`${selectedQuestions.length} selected · ${totalPoints} points total`} className="mt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-medium text-ink/50">Question bank</p>
            <div className="relative mb-2.5">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border border-black/10 py-2 pl-8 pr-3 text-[12.5px] outline-none focus:border-crimson-500"
              />
            </div>
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-black/5 bg-background-muted p-2">
              {availableQuestions.length === 0 ? (
                <p className="px-2 py-3 text-center text-[12px] text-ink/40">No more questions for this subject.</p>
              ) : (
                availableQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => addQuestion(q.id)}
                    className="flex w-full items-start justify-between gap-2 rounded-md bg-white px-3 py-2 text-left text-[12.5px] text-ink shadow-card transition-shadow duration-200 hover:shadow-card-hover"
                  >
                    <span className="line-clamp-2">{q.prompt}</span>
                    <Plus size={14} className="mt-0.5 shrink-0 text-crimson-600" />
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-medium text-ink/50">In this exam, in order</p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-black/5 p-2">
              {selectedQuestions.length === 0 ? (
                <p className="px-2 py-3 text-center text-[12px] text-ink/40">Add questions from the bank.</p>
              ) : (
                selectedQuestions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 rounded-md bg-white px-3 py-2 text-[12.5px] shadow-card">
                    <span className="mt-0.5 shrink-0 text-ink/35">{i + 1}.</span>
                    <span className="flex-1 line-clamp-2 text-ink">{q.prompt}</span>
                    <div className="flex shrink-0 flex-col items-center gap-0.5 text-ink/35">
                      <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="hover:text-ink/70 disabled:opacity-30">
                        <ChevronUp size={13} />
                      </button>
                      <button onClick={() => moveQuestion(i, 1)} disabled={i === selectedQuestions.length - 1} className="hover:text-ink/70 disabled:opacity-30">
                        <ChevronDown size={13} />
                      </button>
                    </div>
                    <button onClick={() => removeQuestion(q.id)} className="mt-0.5 shrink-0 text-ink/30 hover:text-crimson-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ---------- Batches ---------- */}
      <SectionCard title="Lab batches" subtitle="Time windows students can sit this exam in" className="mt-5">
        <div className="space-y-3">
          {form.batches.map((b) => (
            <div key={b.id} className="grid grid-cols-1 gap-2.5 rounded-lg border border-black/5 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-end">
              <TextField label="Label" value={b.label} onChange={(v) => updateBatch(b.id, { label: v })} />
              <TextField label="Starts" value={b.startsAt} onChange={(v) => updateBatch(b.id, { startsAt: v })} type="datetime-local" />
              <TextField label="Ends" value={b.endsAt} onChange={(v) => updateBatch(b.id, { endsAt: v })} type="datetime-local" />
              <TextField label="Lab room" value={b.labRoom ?? ""} onChange={(v) => updateBatch(b.id, { labRoom: v })} placeholder="Optional" />
              <button onClick={() => removeBatch(b.id)} className="flex items-center justify-center rounded-lg border border-black/10 p-2.5 text-ink/40 hover:bg-crimson-50 hover:text-crimson-700">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addBatch}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-black/15 px-3.5 py-2.5 text-[12.5px] font-medium text-ink/60 hover:border-black/25 hover:text-ink/80"
        >
          <CalendarClock size={14} /> Add batch
        </button>
      </SectionCard>

      {error && <p className="mt-4 rounded-md bg-crimson-50 px-3.5 py-2.5 text-[13px] text-crimson-700">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => handleSave("draft")}
          disabled={saving !== null}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 px-4 py-2.5 text-[13.5px] font-medium text-ink/70 hover:bg-background-muted disabled:opacity-60"
        >
          {saving === "draft" && <Loader2 size={14} className="animate-spin" />}
          Save as draft
        </button>
        <button
          onClick={() => handleSave("publish")}
          disabled={saving !== null}
          className="flex items-center gap-1.5 rounded-lg bg-crimson-600 px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-crimson-700 disabled:opacity-70"
        >
          {saving === "publish" && <Loader2 size={14} className="animate-spin" />}
          Publish exam
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

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

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink/60">
        {label} {hint && <span className="text-ink/35">({hint})</span>}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
      />
    </label>
  );
}

function TextField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-ink/55">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-black/10 px-2.5 py-2 text-[12.5px] outline-none focus:border-crimson-500"
      />
    </label>
  );
}

function Toggle({ icon: Icon, label, checked, onChange }: { icon: React.ElementType; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-background-muted px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-[13px] text-ink/75">
        <Icon size={14} className="text-ink/40" />
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-crimson-600" : "bg-black/15"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
