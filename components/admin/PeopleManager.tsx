"use client";

/**
 * PeopleManager — admin screen for creating and managing student and
 * teacher accounts, including the bulk CSV import flow.
 */

import { useMemo, useState } from "react";
import { Plus, Upload, Pencil, Trash2, Search, Ban, CheckCircle, KeyRound } from "lucide-react";
import PersonEditor from "./PersonEditor";
import BulkImportModal, { type ImportRow } from "./BulkImportModal";
import type { PersonRole, PersonRow } from "./types";

interface PeopleManagerProps {
  classOptions: { id: string; name: string }[];
  subjectOptions: string[];
  students: PersonRow[];
  teachers: PersonRow[];
  onCreate: (role: PersonRole, person: Omit<PersonRow, "id" | "isActive">) => Promise<{ credential?: string } | void>;
  onUpdate: (role: PersonRole, id: string, person: Omit<PersonRow, "id" | "isActive">) => Promise<void>;
  onToggleActive: (role: PersonRole, id: string, isActive: boolean) => Promise<void>;
  onDelete: (role: PersonRole, id: string) => Promise<void>;
  onBulkImport: (role: PersonRole, rows: ImportRow[]) => Promise<void>;
}

export default function PeopleManager({
  classOptions,
  subjectOptions,
  students,
  teachers,
  onCreate,
  onUpdate,
  onToggleActive,
  onDelete,
  onBulkImport,
}: PeopleManagerProps) {
  const [tab, setTab] = useState<PersonRole>("student");
  const [search, setSearch] = useState("");
  const [editorState, setEditorState] = useState<"closed" | "new" | PersonRow>("closed");
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PersonRow | null>(null);
  const [createdCredential, setCreatedCredential] = useState<{ name: string; credential: string } | null>(null);

  const classNameById = (id?: string) => classOptions.find((c) => c.id === id)?.name ?? "No class";

  const people = tab === "student" ? students : teachers;
  const filtered = useMemo(
    () => people.filter((p) => !search.trim() || p.fullName.toLowerCase().includes(search.trim().toLowerCase())),
    [people, search]
  );

  const handleSave = async (person: Omit<PersonRow, "id" | "isActive"> & { id?: string }) => {
    if (person.id) {
      await onUpdate(tab, person.id, person);
    } else {
      const result = await onCreate(tab, person);
      if (result?.credential) setCreatedCredential({ name: person.fullName, credential: result.credential });
    }
    setEditorState("closed");
  };

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Students &amp; teachers</h1>
          <p className="mt-0.5 text-[13px] text-ink/50">{students.length} students · {teachers.length} teachers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3.5 py-2.5 text-[13px] font-medium text-ink/70 hover:bg-background-muted"
          >
            <Upload size={15} /> Bulk import
          </button>
          <button
            onClick={() => setEditorState("new")}
            className="flex items-center gap-1.5 rounded-lg bg-crimson-600 px-3.5 py-2.5 text-[13px] font-semibold text-white hover:bg-crimson-700"
          >
            <Plus size={15} /> Add {tab}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 rounded-lg bg-background-muted p-1 sm:w-64">
          {(["student", "teacher"] as PersonRole[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setTab(r);
                setSearch("");
              }}
              className={`rounded-md py-2 text-[12.5px] font-semibold capitalize transition-colors duration-200 ${
                tab === r ? "bg-white text-crimson-700 shadow-card" : "text-ink/50"
              }`}
            >
              {r}s
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}s`}
            className="w-full rounded-lg border border-black/10 py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-crimson-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/10 bg-white px-4 py-10 text-center text-[13px] text-ink/45">
          No {tab}s match. Add one, or bulk import from a CSV.
        </div>
      ) : (
        <div className="divide-y divide-black/5 rounded-lg border border-black/5 bg-white">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[13.5px] font-medium ${p.isActive ? "text-ink" : "text-ink/40"}`}>{p.fullName}</p>
                <p className="truncate text-[12px] text-ink/50">
                  {p.email}
                  {p.role === "student" ? ` · ${classNameById(p.classId)} · ${p.admissionNumber}` : ` · ${p.staffId}${p.subjectNames?.length ? ` · ${p.subjectNames.join(", ")}` : ""}`}
                </p>
              </div>
              {!p.isActive && <span className="shrink-0 rounded-full bg-background-muted px-2 py-0.5 text-[11px] font-medium text-ink/50">Inactive</span>}
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => setEditorState(p)} className="rounded-md p-1.5 text-ink/40 hover:bg-background-muted hover:text-ink">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onToggleActive(tab, p.id, !p.isActive)}
                  className="rounded-md p-1.5 text-ink/40 hover:bg-background-muted hover:text-ink"
                  title={p.isActive ? "Deactivate" : "Reactivate"}
                >
                  {p.isActive ? <Ban size={15} /> : <CheckCircle size={15} />}
                </button>
                <button onClick={() => setDeleteTarget(p)} className="rounded-md p-1.5 text-ink/40 hover:bg-crimson-50 hover:text-crimson-700">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorState !== "closed" && (
        <PersonEditor
          key={editorState === "new" ? "new" : editorState.id}
          role={tab}
          initial={editorState === "new" ? null : editorState}
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          onSave={handleSave}
          onCancel={() => setEditorState("closed")}
        />
      )}

      {importOpen && (
        <BulkImportModal
          role={tab}
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          onImport={(rows) => onBulkImport(tab, rows)}
          onClose={() => setImportOpen(false)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-card-hover">
            <h2 className="font-display text-[15px] font-semibold text-ink">Delete {deleteTarget.fullName}?</h2>
            <p className="mt-1.5 text-[13px] text-ink/60">
              This removes their account permanently. Consider deactivating instead if they might return.
            </p>
            <div className="mt-4 flex gap-2.5">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border border-black/10 py-2.5 text-[13px] font-medium text-ink/70 hover:bg-background-muted">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDelete(tab, deleteTarget.id);
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

      {createdCredential && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-card-hover">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-crimson-50 text-crimson-700">
              <KeyRound size={18} />
            </div>
            <h2 className="font-display text-[15px] font-semibold text-ink">Account created</h2>
            <p className="mt-1.5 text-[13px] text-ink/60">
              Share this temporary {tab === "student" ? "PIN" : "password"} with {createdCredential.name} — it won't be shown again.
            </p>
            <p className="mt-3 rounded-md bg-background-muted px-3 py-2.5 text-center font-mono text-[15px] font-semibold tracking-wider text-ink">
              {createdCredential.credential}
            </p>
            <button
              onClick={() => setCreatedCredential(null)}
              className="mt-4 w-full rounded-lg bg-crimson-600 py-2.5 text-[13px] font-semibold text-white hover:bg-crimson-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
