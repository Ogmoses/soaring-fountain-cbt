"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsManager from "@/components/admin/SettingsManager";
import { createClient } from "@/lib/supabase/client";
import { orThrow } from "@/lib/supabaseErrors";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import type { GradeBand, SchoolProfile } from "@/components/admin/types";
import PageLoading from "@/components/layout/PageLoading";

const EMPTY_PROFILE: SchoolProfile = { schoolName: "", motto: "", address: "", logoUrl: null };

export default function AdminSettingsPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [profile, setProfile] = useState<SchoolProfile>(EMPTY_PROFILE);
  const [scale, setScale] = useState<GradeBand[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [{ data: profileRow }, { data: scaleRows }] = await Promise.all([
      supabase.from("school_profile").select("school_name, motto, address, logo_url").eq("id", true).single(),
      supabase.from("grading_scale").select("id, min_score, max_score, grade_letter, remark").order("min_score", { ascending: false }),
    ]);

    if (profileRow) {
      setProfile({ schoolName: profileRow.school_name, motto: profileRow.motto ?? "", address: profileRow.address ?? "", logoUrl: profileRow.logo_url });
    }
    setScale((scaleRows ?? []).map((r) => ({ id: r.id, minScore: r.min_score, maxScore: r.max_score, gradeLetter: r.grade_letter, remark: r.remark ?? "" })));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (p: SchoolProfile) => {
    // NOTE: `logoUrl` may be a data: URL from the local file preview in
    // SettingsManager — that's fine for a quick demo but bloats the row.
    // For real use, upload the file to Supabase Storage first and save
    // the returned public URL here instead.
    await orThrow(supabase.from("school_profile").update({ school_name: p.schoolName, motto: p.motto || null, address: p.address || null, logo_url: p.logoUrl }).eq("id", true));
    await loadAll();
  };

  const handleSaveGradingScale = async (bands: GradeBand[]) => {
    // Small table, rewritten wholesale each save — simpler and safer than
    // diffing client-generated temp ids against real DB rows.
    await orThrow(supabase.from("grading_scale").delete().gte("min_score", -999999));
    if (bands.length > 0) {
      await orThrow(supabase.from("grading_scale").insert(bands.map((b) => ({ min_score: b.minScore, max_score: b.maxScore, grade_letter: b.gradeLetter, remark: b.remark || null }))));
    }
    await loadAll();
  };

  return (
    <DashboardLayout role="super_admin" pageTitle="Settings" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? <PageLoading /> : (
        <SettingsManager profile={profile} gradingScale={scale} onSaveProfile={handleSaveProfile} onSaveGradingScale={handleSaveGradingScale} />
      )}
    </DashboardLayout>
  );
}
