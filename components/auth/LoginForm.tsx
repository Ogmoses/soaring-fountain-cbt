"use client";

/**
 * Login — Soaring Fountain Group of Schools
 *
 * Students authenticate with Admission Number + PIN (fast entry on shared
 * lab computers). Teachers/Admins authenticate with Email + Password via
 * Supabase Auth. Wire `onStudentLogin` / `onStaffLogin` to your auth calls —
 * this component only owns form state and validation.
 */

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Waves, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

type Mode = "student" | "staff";

interface LoginFormProps {
  onStudentLogin: (admissionNumber: string, pin: string) => Promise<void>;
  onStaffLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginForm({ onStudentLogin, onStaffLogin }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>("student");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "student") {
        if (!admissionNumber.trim() || !pin.trim()) {
          setError("Enter your admission number and PIN.");
          return;
        }
        await onStudentLogin(admissionNumber.trim(), pin.trim());
      } else {
        if (!email.trim() || !password.trim()) {
          setError("Enter your email and password.");
          return;
        }
        await onStaffLogin(email.trim(), password.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-lg bg-white p-7 shadow-card-hover sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-crimson-600 text-white">
            <Waves size={22} strokeWidth={2.25} />
          </div>
          <h1 className="font-display text-[17px] font-semibold text-ink">Soaring Fountain</h1>
          <p className="text-[12.5px] text-ink/50">Group of Schools — CBT Portal</p>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 grid grid-cols-2 rounded-lg bg-background-muted p-1">
          {(["student", "staff"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-md py-2 text-[12.5px] font-semibold capitalize transition-colors duration-200 ${
                mode === m ? "bg-white text-crimson-700 shadow-card" : "text-ink/50"
              }`}
            >
              {m === "student" ? "Student" : "Teacher / Admin"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "student" ? (
            <>
              <Field
                label="Admission number"
                value={admissionNumber}
                onChange={setAdmissionNumber}
                placeholder="e.g. SFGS/2023/0142"
                autoFocus
              />
              <Field
                label="PIN"
                value={pin}
                onChange={setPin}
                placeholder="4–6 digit PIN"
                type={showSecret ? "text" : "password"}
                inputMode="numeric"
                trailingIcon={
                  <button type="button" onClick={() => setShowSecret((v) => !v)} className="text-ink/40 hover:text-ink/60">
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </>
          ) : (
            <>
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@soaringfountain.edu" type="email" autoFocus />
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                type={showSecret ? "text" : "password"}
                trailingIcon={
                  <button type="button" onClick={() => setShowSecret((v) => !v)} className="text-ink/40 hover:text-ink/60">
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-crimson-50 px-3 py-2.5 text-[12.5px] text-crimson-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-crimson-600 py-3 text-[13.5px] font-semibold text-white transition-colors duration-200 hover:bg-crimson-700 disabled:opacity-70"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {mode === "student" && (
          <p className="mt-4 text-center text-[11.5px] text-ink/45">
            Forgotten your PIN? Ask your class teacher to reset it.
          </p>
        )}
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
  inputMode,
  trailingIcon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  inputMode?: "text" | "numeric";
  trailingIcon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink/60">{label}</span>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          inputMode={inputMode}
          className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-[13.5px] outline-none transition-shadow duration-200 focus:border-crimson-500 focus:shadow-focus"
        />
        {trailingIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailingIcon}</div>}
      </div>
    </label>
  );
}
