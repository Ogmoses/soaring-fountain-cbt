"use client";

/**
 * QuestionBankManager — browse, filter, create, edit, and delete questions.
 * Pair with QuestionEditor (the modal form) and the `questions` table in
 * database/schema.sql.
 */

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, ImageIcon } from "lucide-react";
import QuestionEditor from "./QuestionEditor";
import { QUESTION_TYPE_LABEL, type BankQuestion, type SubjectOption } from "./types";

interface QuestionBankManagerProps {
  subjects: SubjectOption[];
  questions: BankQuestion[];
  onCreate: (q: Omit<BankQuestion, "id" | "updatedAt" | "subjectName">) => Promise<void>;
  onUpdate: (id: string, q: Omit<BankQuestion, "id" | "updatedAt" | "subjectName">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function QuestionBankManager({ subjects, questions, onCreate, onUpdate, onDelete }: QuestionBankManagerProps) {
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editorState, setEditorState] = useState<"closed" | "new" | BankQuestion>("closed");
  const [deleteTarget, setDeleteTarget] = useState<BankQuestion | null>(null);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (subjectFilter !== "all" && q.subjectId !== subjectFilter) return false;
      if (search.trim() && !q.prompt.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [questions, subjectFilter, search]);

  const handleSave = async (data: Omit<BankQuestion, "id" | "updatedAt" | "subjectName"> & { id?: string }) => {
    if (data.id) {
      await onUpdate(data.id, data);
    } else {
      await onCreate(data);
    }
    setEditorState("closed");
  };

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Question bank</h1>
          <p className="mt-0.5 text-[13px] text-ink/50">{questions.length} question{questions.length === 1 ? "" : "s"} across your subjects</p>
        </div>
        <button
          onClick={() => setEditorState("new")}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-crimson-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-crimson-700"
        >
          <Plus size={16} /> New question
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question text"
            className="w-full rounded-lg border border-black/10 py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-crimson-500"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/10 bg-white px-4 py-10 text-center text-[13px] text-ink/45">
          No questions match. Try a different filter, or add your first question.
        </div>
      ) : (
        <div className="divide-y divide-black/5 rounded-lg border border-black/5 bg-white">
          {filtered.map((q) => (
            <div key={q.id} className="flex items-start gap-3.5 px-4 py-3.5 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10.5px] font-semibold text-crimson-700">
                    {QUESTION_TYPE_LABEL[q.type]}
                  </span>
                  <span className="text-[11.5px] text-ink/40">{q.subjectName}{q.topic ? ` · ${q.topic}` : ""}</span>
                  {q.imageUrl && <ImageIcon size={12} className="text-ink/30" />}
                </div>
                <p className="truncate text-[13.5px] text-ink">{q.prompt}</p>
              </div>
              <span className="shrink-0 pt-0.5 text-[12px] font-medium text-ink/40">{q.points} pt{q.points === 1 ? "" : "s"}</span>
              <div className="flex shrink-0 items-center gap-1 pt-0.5">
                <button onClick={() => setEditorState(q)} className="rounded-md p-1.5 text-ink/40 hover:bg-background-muted hover:text-ink">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteTarget(q)} className="rounded-md p-1.5 text-ink/40 hover:bg-crimson-50 hover:text-crimson-700">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorState !== "closed" && (
        <QuestionEditor
          key={editorState === "new" ? "new" : editorState.id}
          initial={editorState === "new" ? null : editorState}
          subjects={subjects}
          defaultSubjectId={subjectFilter !== "all" ? subjectFilter : undefined}
          onSave={handleSave}
          onCancel={() => setEditorState("closed")}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-card-hover">
            <h2 className="font-display text-[15px] font-semibold text-ink">Delete this question?</h2>
            <p className="mt-1.5 text-[13px] text-ink/60">
              It will be removed from the bank. Exams that already used it keep their recorded answers.
            </p>
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-black/10 py-2.5 text-[13px] font-medium text-ink/70 hover:bg-background-muted"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 rounded-lg bg-crimson-600 py-2.5 text-[13px] font-semibold text-white hover:bg-crimson-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
