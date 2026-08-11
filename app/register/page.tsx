"use client";

/**
 * /register — where an invited teacher (or admin) lands after clicking
 * the link in their invite email. Supabase's browser client auto-detects
 * the session from the URL fragment on load (detectSessionInUrl, on by
 * default) — by the time this component mounts, `auth.getUser()` already
 * reflects the invited account, no token-parsing needed here.
 */

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Waves, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setChecking(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("users").select("role").eq("id", auth.user!.id).single();
      router.push(profile?.role === "super_admin" ? "/admin" : "/teacher");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set your password. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <Loader2 size={20} className="animate-spin text-crimson-600" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-100 px-6 text-center">
        <AlertCircle size={22} className="text-crimson-600" />
        <p className="text-[14px] text-ink">This invite link is invalid or has expired.</p>
        <p className="text-[13px] text-ink/50">Ask your admin to send a new one from Students &amp; Teachers.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4 font-sans">
      <div className="w-full max-w-sm rounded-lg bg-white p-7 shadow-card-hover sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-crimson-600 text-white">
            <Waves size={22} strokeWidth={2.25} />
          </div>
          <h1 className="font-display text-[17px] font-semibold text-ink">Welcome to Soaring Fountain</h1>
          <p className="mt-1 text-[12.5px] text-ink/50">Set a password for {email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-ink/60">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoFocus
                className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 pr-10 text-[13.5px] outline-none focus:border-crimson-500"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/60">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-ink/60">Confirm password</span>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-crimson-500"
            />
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-crimson-50 px-3 py-2.5 text-[12.5px] text-crimson-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-crimson-600 py-3 text-[13.5px] font-semibold text-white transition-colors duration-200 hover:bg-crimson-700 disabled:opacity-70"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Setting password…" : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
