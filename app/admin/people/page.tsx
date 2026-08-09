"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PeopleManager from "@/components/admin/PeopleManager";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import type { ImportRow } from "@/components/admin/BulkImportModal";
import type { PersonRole, PersonRow } from "@/components/admin/types";

export default function AdminPeoplePage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [students, setStudents] = useState<PersonRow[]>([]);
  const [teachers, setTeachers] = useState<PersonRow[]>([]);
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [{ data: users }, { data: classes }, { data: subjects }] = await Promise.all([
      supabase.from("users").select("id, role, full_name, email, admission_number, staff_id, class_id, is_active").in("role", ["student", "teacher"]),
      supabase.from("classes").select("id, name"),
      supabase.from("subjects").select("name"),
    ]);

    const toRow = (u: any): PersonRow => ({
      id: u.id,
      role: u.role,
      fullName: u.full_name,
      email: u.email,
      admissionNumber: u.admission_number ?? undefined,
      staffId: u.staff_id ?? undefined,
      classId: u.class_id ?? undefined,
      isActive: u.is_active,
    });

    setStudents((users ?? []).filter((u) => u.role === "student").map(toRow));
    setTeachers((users ?? []).filter((u) => u.role === "teacher").map(toRow));
    setClassOptions(classes ?? []);
    setSubjectOptions((subjects ?? []).map((s) => s.name));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (role: PersonRole, person: Omit<PersonRow, "id" | "isActive">) => {
    const res = await fetch("/api/admin/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, fullName: person.fullName, email: person.email, admissionNumber: person.admissionNumber, staffId: person.staffId, classId: person.classId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Couldn't create that account.");
    await loadAll();
    return { credential: data.credential as string };
  };

  const handleUpdate = async (_role: PersonRole, id: string, person: Omit<PersonRow, "id" | "isActive">) => {
    const res = await fetch("/api/admin/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fullName: person.fullName, email: person.email, admissionNumber: person.admissionNumber, staffId: person.staffId, classId: person.classId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Couldn't update that account.");
    await loadAll();
  };

  const handleToggleActive = async (_role: PersonRole, id: string, isActive: boolean) => {
    const res = await fetch("/api/admin/people", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive }) });
    if (!res.ok) throw new Error("Couldn't update that account.");
    await loadAll();
  };

  const handleDelete = async (_role: PersonRole, id: string) => {
    const res = await fetch("/api/admin/people", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!res.ok) throw new Error("Couldn't delete that account.");
    await loadAll();
  };

  const handleBulkImport = async (role: PersonRole, rows: ImportRow[]) => {
    const res = await fetch("/api/admin/people/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, rows }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "The import failed.");
    await loadAll();
    if (data.failureCount > 0) {
      // TODO: surface which specific rows failed (data.results) in the UI
      // instead of one summary line — BulkImportModal's contract only takes
      // a thrown Error today.
      throw new Error(`Imported ${data.successCount} of ${rows.length}. ${data.failureCount} failed — likely duplicate emails.`);
    }
  };

  if (loading) return null; // TODO: swap in a loading skeleton once the design system has one

  return (
    <DashboardLayout role="super_admin" pageTitle="Students & Teachers" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      <PeopleManager
        classOptions={classOptions}
        subjectOptions={subjectOptions}
        students={students}
        teachers={teachers}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onBulkImport={handleBulkImport}
      />
    </DashboardLayout>
  );
}
