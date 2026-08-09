"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LabBatchesManager from "@/components/admin/LabBatchesManager";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import type { BatchTemplate, LabRoom } from "@/components/admin/types";

export default function AdminLabBatchesPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [rooms, setRooms] = useState<LabRoom[]>([]);
  const [templates, setTemplates] = useState<BatchTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [{ data: roomRows }, { data: templateRows }] = await Promise.all([
      supabase.from("lab_rooms").select("id, name, capacity").order("name"),
      supabase.from("batch_templates").select("id, label, start_time, end_time").order("start_time"),
    ]);
    setRooms(roomRows ?? []);
    // Postgres `time` comes back as "08:00:00" — trim to "08:00" for <input type="time">.
    setTemplates((templateRows ?? []).map((t) => ({ id: t.id, label: t.label, startTime: t.start_time.slice(0, 5), endTime: t.end_time.slice(0, 5) })));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveRoom = async (r: Omit<LabRoom, "id"> & { id?: string }) => {
    if (r.id) await supabase.from("lab_rooms").update({ name: r.name, capacity: r.capacity }).eq("id", r.id);
    else await supabase.from("lab_rooms").insert({ name: r.name, capacity: r.capacity });
    await loadAll();
  };
  const handleDeleteRoom = async (id: string) => {
    await supabase.from("lab_rooms").delete().eq("id", id);
    await loadAll();
  };

  const handleSaveTemplate = async (t: Omit<BatchTemplate, "id"> & { id?: string }) => {
    const payload = { label: t.label, start_time: t.startTime, end_time: t.endTime };
    if (t.id) await supabase.from("batch_templates").update(payload).eq("id", t.id);
    else await supabase.from("batch_templates").insert(payload);
    await loadAll();
  };
  const handleDeleteTemplate = async (id: string) => {
    await supabase.from("batch_templates").delete().eq("id", id);
    await loadAll();
  };

  if (loading) return null; // TODO: swap in a loading skeleton once the design system has one

  return (
    <DashboardLayout role="super_admin" pageTitle="Lab Batches" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      <LabBatchesManager
        rooms={rooms}
        templates={templates}
        onSaveRoom={handleSaveRoom}
        onDeleteRoom={handleDeleteRoom}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </DashboardLayout>
  );
}
