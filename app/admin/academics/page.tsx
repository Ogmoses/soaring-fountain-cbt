"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AcademicsManager from "@/components/admin/AcademicsManager";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import type { ClassRow, SessionRow, SubjectRow, TermRow } from "@/components/admin/types";
import PageLoading from "@/components/layout/PageLoading";

export default function AdminAcademicsPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [{ data: sessionRows }, { data: termRows }, { data: classRows }, { data: subjectRows }, { data: studentClassIds }] = await Promise.all([
      supabase.from("academic_sessions").select("id, name, is_current").order("name", { ascending: false }),
      supabase.from("terms").select("id, session_id, name, is_current, starts_on, ends_on"),
      supabase.from("classes").select("id, name, level"),
      supabase.from("subjects").select("id, name, code, class_subjects(class_id)"),
      supabase.from("users").select("class_id").eq("role", "student"),
    ]);

    const studentCountByClass = new Map<string, number>();
    for (const row of studentClassIds ?? []) {
      if (!row.class_id) continue;
      studentCountByClass.set(row.class_id, (studentCountByClass.get(row.class_id) ?? 0) + 1);
    }

    setSessions((sessionRows ?? []).map((s) => ({ id: s.id, name: s.name, isCurrent: s.is_current })));
    setTerms(
      (termRows ?? []).map((t) => ({
        id: t.id,
        sessionId: t.session_id,
        name: t.name,
        isCurrent: t.is_current,
        startsOn: t.starts_on ?? undefined,
        endsOn: t.ends_on ?? undefined,
      }))
    );
    setClasses((classRows ?? []).map((c) => ({ id: c.id, name: c.name, level: c.level ?? undefined, studentCount: studentCountByClass.get(c.id) ?? 0 })));
    setSubjects(
      (subjectRows ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code ?? undefined,
        classIds: (s.class_subjects ?? []).map((cs: any) => cs.class_id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSession = async (s: Omit<SessionRow, "id"> & { id?: string }) => {
    if (s.isCurrent) await supabase.from("academic_sessions").update({ is_current: false }).eq("is_current", true);
    if (s.id) await supabase.from("academic_sessions").update({ name: s.name, is_current: s.isCurrent }).eq("id", s.id);
    else await supabase.from("academic_sessions").insert({ name: s.name, is_current: s.isCurrent });
    await loadAll();
  };
  const handleDeleteSession = async (id: string) => {
    await supabase.from("academic_sessions").delete().eq("id", id);
    await loadAll();
  };

  const handleSaveTerm = async (sessionId: string, t: Omit<TermRow, "id" | "sessionId"> & { id?: string }) => {
    if (t.isCurrent) await supabase.from("terms").update({ is_current: false }).eq("session_id", sessionId).eq("is_current", true);
    const payload = { session_id: sessionId, name: t.name, is_current: t.isCurrent, starts_on: t.startsOn || null, ends_on: t.endsOn || null };
    if (t.id) await supabase.from("terms").update(payload).eq("id", t.id);
    else await supabase.from("terms").insert(payload);
    await loadAll();
  };
  const handleDeleteTerm = async (id: string) => {
    await supabase.from("terms").delete().eq("id", id);
    await loadAll();
  };

  const handleSaveClass = async (c: Omit<ClassRow, "id" | "studentCount"> & { id?: string }) => {
    if (c.id) await supabase.from("classes").update({ name: c.name, level: c.level }).eq("id", c.id);
    else await supabase.from("classes").insert({ name: c.name, level: c.level });
    await loadAll();
  };
  const handleDeleteClass = async (id: string) => {
    await supabase.from("classes").delete().eq("id", id);
    await loadAll();
  };

  const handleSaveSubject = async (s: Omit<SubjectRow, "id"> & { id?: string }) => {
    let subjectId = s.id;
    if (subjectId) {
      await supabase.from("subjects").update({ name: s.name, code: s.code ?? null }).eq("id", subjectId);
    } else {
      const { data: created } = await supabase.from("subjects").insert({ name: s.name, code: s.code ?? null }).select("id").single();
      subjectId = created?.id;
    }
    if (subjectId) {
      await supabase.from("class_subjects").delete().eq("subject_id", subjectId);
      if (s.classIds.length > 0) {
        await supabase.from("class_subjects").insert(s.classIds.map((classId) => ({ class_id: classId, subject_id: subjectId })));
      }
    }
    await loadAll();
  };
  const handleDeleteSubject = async (id: string) => {
    await supabase.from("subjects").delete().eq("id", id);
    await loadAll();
  };

  return (
    <DashboardLayout role="super_admin" pageTitle="Classes & Subjects" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? <PageLoading /> : (
        <AcademicsManager
          sessions={sessions}
          terms={terms}
          classes={classes}
          subjects={subjects}
          onSaveSession={handleSaveSession}
          onDeleteSession={handleDeleteSession}
          onSaveTerm={handleSaveTerm}
          onDeleteTerm={handleDeleteTerm}
          onSaveClass={handleSaveClass}
          onDeleteClass={handleDeleteClass}
          onSaveSubject={handleSaveSubject}
          onDeleteSubject={handleDeleteSubject}
        />
      )}
    </DashboardLayout>
  );
}
