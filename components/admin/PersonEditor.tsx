"use client";

/**
 * PersonEditor — create/edit one student or teacher account.
 * Mount with `key={initial?.id ?? "new"}` so fields reset per person.
 */

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { PersonRole, PersonRow } from "./types";

interface PersonEditorProps {
  role: PersonRole;
  initial?: PersonRow | null;
  classOptions: { id: string; name: string }[]; // for students
  subjectOptions: string[]; // for teachers
  onSave: (person: Omit<PersonRow, "id" | "isActive"> & { id?: string }) => Promise<{ credential?: string } | void>;
  onCancel: () => void;
}

export default function PersonEditor({ role, initial, classOptions, subjectOptions, onSave, onCancel }: PersonEditorProps) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [admissionNumber, setAdmissionNumber] = useState(initial?.admissionNumber ?? "");
  const [staffId, setStaffId] = useState(initial?.staffId ?? "");
  const [classId, setClassId] = useState(initial?.classId ?? classOptions[0]?.id ?? "");
  const [subjectNames, setSubjectNames] = useState<string[]>(initial?.subjectNames ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleSubject = (name: string) =>
    setSubjectNames((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]));

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (role === "student" && !admissionNumber.trim()) {
      setError("Add an admission number.");
      return;
    }
    if (role === "teacher" && !staffId.trim()) {
      setError("Add a staff ID.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({
        id: initial?.id,
        role,
        fullName: fullName.trim(),
        email: email.trim(),
        admissionNumber: role === "student" ? admissionNumber.trim() : undefined,
        staffId: role === "teacher" ? staffId.trim() : undefined,
        classId: role === "student" ? classId : undefined,
        subjectNames: role === "teacher" ? subjectNames : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this account. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-card-hover">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="font-display text-[15px] font-semibold text-ink">
            {initial ? "Edit" : "New"} {role === "student" ? "student" : "teacher"}
          </h2>
          <button onClick={onCancel} className="rounded-md p-1.5 text-ink/40 hover:bg-background-muted">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 px-5 py-4">
          <Field label="Full name" value={fullName} onChange={setFullName} placeholder="e.g. Chidinma Okafor" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="name@soaringfountain.edu" type="email" />

          {role === "student" ? (
            <>
              <Field label="Admission number" value={admissionNumber} onChange={setAdmissionNumber} placeholder="e.g. SFGS/2023/0142" />
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-ink/60">Class</span>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-crimson-500"
                >
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <Field label="Staff ID" value={staffId} onChange={setStaffId} placeholder="e.g. SFGS-T-014" />
              <div>
                <span className="mb-1.5 block text-[12px] font-medium text-ink/60">Subjects taught</span>
                <div className="flex flex-wrap gap-1.5">
                  {subjectOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSubject(s)}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
                        subjectNames.includes(s) ? "bg-crimson-600 text-white" : "bg-background-muted text-ink/60 hover:bg-black/5"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

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
            {saving ? "Saving…" : "Save account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-[13px] outline-none focus:border-crimson-500"
      />
    </label>
  );
}
