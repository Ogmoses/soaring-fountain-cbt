"use client";

/**
 * SettingsManager — school profile (used on report-card letterheads) and
 * the grading scale (`grading_scale` in database/schema.sql) that turns a
 * score into a grade letter across the platform.
 */

import { useState } from "react";
import { Plus, Trash2, Loader2, ImagePlus, X, Save } from "lucide-react";
import type { GradeBand, SchoolProfile } from "./types";

interface SettingsManagerProps {
  profile: SchoolProfile;
  gradingScale: GradeBand[];
  onSaveProfile: (profile: SchoolProfile) => Promise<void>;
  onSaveGradingScale: (bands: GradeBand[]) => Promise<void>;
}

export default function SettingsManager({ profile, gradingScale, onSaveProfile, onSaveGradingScale }: SettingsManagerProps) {
  return (
    <div className="max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Settings</h1>
        <p className="mt-0.5 text-[13px] text-ink/50">School profile and the grading scale used across results and report cards.</p>
      </div>
      <ProfileSection profile={profile} onSave={onSaveProfile} />
      <GradingScaleSection bands={gradingScale} onSave={onSaveGradingScale} />
    </div>
  );
}

function ProfileSection({ profile, onSave }: { profile: SchoolProfile; onSave: (p: SchoolProfile) => Promise<void> }) {
  const [schoolName, setSchoolName] = useState(profile.schoolName);
  const [motto, setMotto] = useState(profile.motto ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLogo = (file: File | null) => {
    if (!file) return;
    // TODO: upload to Supabase Storage and store the returned public URL —
    // this data URL is only for local preview.
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave({ schoolName, motto, address, logoUrl });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="School profile" subtitle="Appears on the report-card letterhead">
      <div className="flex items-start gap-4">
        {logoUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="School logo" className="h-16 w-16 rounded-lg border border-black/10 object-contain" />
            <button onClick={() => setLogoUrl(null)} className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-ink/60 shadow-card hover:text-crimson-700">
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="flex h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/15 text-ink/40 hover:border-black/25">
            <ImagePlus size={17} />
            <span className="text-[9px] font-medium">Logo</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0] ?? null)} />
          </label>
        )}
        <div className="flex-1 space-y-3">
          <TextField label="School name" value={schoolName} onChange={setSchoolName} />
          <TextField label="Motto (optional)" value={motto} onChange={setMotto} placeholder="e.g. Knowledge, Character, Excellence" />
        </div>
      </div>
      <label className="mt-3.5 block">
        <span className="mb-1 block text-[12px] font-medium text-ink/60">Address</span>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-black/10 px-3.5 py-2.5 text-[13px] outline-none focus:border-crimson-500"
        />
      </label>

      <SaveButton onClick={handleSave} saving={saving} saved={saved} />
    </SectionCard>
  );
}

function GradingScaleSection({ bands: initialBands, onSave }: { bands: GradeBand[]; onSave: (bands: GradeBand[]) => Promise<void> }) {
  const [bands, setBands] = useState(initialBands);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (id: string, patch: Partial<GradeBand>) => setBands((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const addBand = () => setBands((prev) => [...prev, { id: crypto.randomUUID(), minScore: 0, maxScore: 0, gradeLetter: "", remark: "" }]);
  const removeBand = (id: string) => setBands((prev) => prev.filter((b) => b.id !== id));

  const handleSave = async () => {
    if (bands.some((b) => !b.gradeLetter.trim())) {
      setError("Every band needs a grade letter.");
      return;
    }
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      await onSave(bands);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Grading scale" subtitle="Score ranges map to a letter grade and remark">
      {/* Desktop/tablet: compact grid-table */}
      <div className="hidden space-y-2 sm:block">
        <div className="grid grid-cols-[1fr_1fr_0.7fr_1.4fr_auto] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-ink/40">
          <span>Min</span>
          <span>Max</span>
          <span>Grade</span>
          <span>Remark</span>
          <span />
        </div>
        {bands.map((b) => (
          <div key={b.id} className="grid grid-cols-[1fr_1fr_0.7fr_1.4fr_auto] items-center gap-2">
            <input type="number" value={b.minScore} onChange={(e) => update(b.id, { minScore: Number(e.target.value) })} className="w-full min-w-0 rounded-lg border border-black/10 px-2.5 py-2 text-[12.5px] outline-none focus:border-crimson-500" />
            <input type="number" value={b.maxScore} onChange={(e) => update(b.id, { maxScore: Number(e.target.value) })} className="w-full min-w-0 rounded-lg border border-black/10 px-2.5 py-2 text-[12.5px] outline-none focus:border-crimson-500" />
            <input value={b.gradeLetter} onChange={(e) => update(b.id, { gradeLetter: e.target.value })} className="w-full min-w-0 rounded-lg border border-black/10 px-2.5 py-2 text-[12.5px] outline-none focus:border-crimson-500" />
            <input value={b.remark} onChange={(e) => update(b.id, { remark: e.target.value })} className="w-full min-w-0 rounded-lg border border-black/10 px-2.5 py-2 text-[12.5px] outline-none focus:border-crimson-500" />
            <button onClick={() => removeBand(b.id)} className="shrink-0 rounded-md p-2 text-ink/30 hover:bg-crimson-50 hover:text-crimson-700">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile: one card per band — a 5-column grid never fits a phone width */}
      <div className="space-y-2.5 sm:hidden">
        {bands.map((b) => (
          <div key={b.id} className="rounded-lg border border-black/10 p-3">
            <div className="mb-2 grid grid-cols-3 gap-2">
              <MiniField label="Min" value={b.minScore} onChange={(v) => update(b.id, { minScore: Number(v) })} type="number" />
              <MiniField label="Max" value={b.maxScore} onChange={(v) => update(b.id, { maxScore: Number(v) })} type="number" />
              <MiniField label="Grade" value={b.gradeLetter} onChange={(v) => update(b.id, { gradeLetter: v })} />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <MiniField label="Remark" value={b.remark} onChange={(v) => update(b.id, { remark: v })} />
              </div>
              <button onClick={() => removeBand(b.id)} className="shrink-0 rounded-md border border-black/10 p-2.5 text-ink/40 hover:bg-crimson-50 hover:text-crimson-700">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addBand} className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-crimson-700 hover:text-crimson-800">
        <Plus size={14} /> Add band
      </button>

      {error && <p className="mt-3 rounded-md bg-crimson-50 px-3 py-2 text-[12.5px] text-crimson-700">{error}</p>}
      <SaveButton onClick={handleSave} saving={saving} saved={saved} />
    </SectionCard>
  );
}

function MiniField({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-0.5 block text-[9.5px] font-medium uppercase tracking-wide text-ink/40">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-lg border border-black/10 px-2 py-2 text-[12.5px] outline-none focus:border-crimson-500"
      />
    </label>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-4.5 shadow-card sm:p-5">
      <div className="mb-4">
        <h2 className="font-display text-[14px] font-semibold text-ink">{title}</h2>
        <p className="text-[12px] text-ink/45">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink/60">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-[13px] outline-none focus:border-crimson-500" />
    </label>
  );
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="mt-4 flex items-center gap-1.5 rounded-lg bg-crimson-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-crimson-700 disabled:opacity-70"
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
    </button>
  );
}
