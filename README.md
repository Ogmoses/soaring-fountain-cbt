# Soaring Fountain CBT & School Management Platform

A complete, deployable Next.js (App Router) + Supabase project — not just
source files to copy in. `npm install` and `npm run dev` work directly in
this folder once Supabase env vars are set.

**Deploying this for real? See [`DEPLOYMENT.md`](./DEPLOYMENT.md)** —
step-by-step from this folder to a live URL on GitHub + Supabase + Vercel,
including the one manual step every setup needs (bootstrapping the first
Super Admin account) and a troubleshooting section.

## Setup notes
- Fonts: `app/layout.tsx` already loads **Plus Jakarta Sans** (display)
  and **Inter** (body) via `next/font/google`, exposed as
  `--font-plus-jakarta` / `--font-inter` to match `tailwind.config.ts`.
- Every file with a `// TODO` comment is a stub where real Supabase calls
  (auth, queries) replace sample data — the shapes already mirror the schema.
- Env vars: copy `.env.example` to `.env.local` and fill in your Supabase
  project's URL, publishable key, and secret key (see `DEPLOYMENT.md` Part C
  for exactly where to find each one, including a note on Supabase's
  ongoing anon/service_role → publishable/secret key rename).
- Report cards: needs real font files registered with `@react-pdf/renderer`
  (see `public/fonts/README.md`) — the rest of the app doesn't depend on
  this, so it's safe to add later.
- Next.js 16 renamed `middleware.ts` to `proxy.ts` (and the exported
  function from `middleware` to `proxy`) — this project already uses the
  new convention in `proxy.ts` at the root.

## Built so far
| Area | File |
|---|---|
| Database schema | `database/schema.sql` |
| Tailwind design tokens | `tailwind.config.ts` |
| App shell (sidebar/navbar) | `components/layout/*.tsx` |
| Login (student PIN + staff password) | `components/auth/LoginForm.tsx`, `app/login/page.tsx` |
| Student Exam Launchpad | `components/student/ExamLaunchpad.tsx`, `app/student/page.tsx` |
| Live CBT Exam runner | `components/exam/ExamInterface.tsx` |
| Teacher: Question Bank (create/edit/delete, image upload) | `components/teacher/QuestionBankManager.tsx`, `QuestionEditor.tsx`, `app/teacher/questions/page.tsx` |
| Teacher: Exam Builder (rules, question picker, batch scheduling) | `components/teacher/ExamBuilder.tsx`, `app/teacher/exams/page.tsx` |
| Teacher: Grading Queue (manual marking, save & next) | `components/teacher/GradingQueue.tsx`, `GradingPanel.tsx`, `app/teacher/grading/page.tsx` |
| Teacher: Class Analytics (stats, distribution, hardest questions, roster) | `components/teacher/ClassAnalytics.tsx`, `app/teacher/analytics/page.tsx` |

Teacher portal is now complete end to end.

| Admin: Overview (stats + today's batches, lab-conflict flagging) | `components/admin/AdminOverview.tsx`, `app/admin/page.tsx` |
| Admin: Students & Teachers (CRUD + bulk CSV import) | `components/admin/PeopleManager.tsx`, `PersonEditor.tsx`, `BulkImportModal.tsx`, `csv.ts`, `app/admin/people/page.tsx` |
| Admin: Classes & Subjects (sessions, terms, classes, subjects) | `components/admin/AcademicsManager.tsx`, `AcademicsEditors.tsx`, `app/admin/academics/page.tsx` |
| Admin: Lab Batches (rooms + reusable time templates) | `components/admin/LabBatchesManager.tsx`, `app/admin/batches/page.tsx` |
| Admin: Results & Analytics (publish queue, class/subject performance) | `components/admin/ResultsAnalytics.tsx`, `app/admin/results/page.tsx` |
| Admin: Settings (school profile, grading scale) | `components/admin/SettingsManager.tsx`, `app/admin/settings/page.tsx` |

**All three portals (Student, Teacher, Admin) are now fully built.**

| Backend: Supabase client factories | `lib/supabase/client.ts`, `server.ts` |
| Backend: pure grading logic (auto-mark, grade-letter lookup, weighted CA/terminal rollup) | `lib/grading.ts` |
| Backend: seeded shuffle (stable per-session question/option order) | `lib/shuffle.ts` |
| Backend: start a session — batch-window check, roster check, single-active-session enforcement, stale-session reclaim | `app/api/exam-sessions/start/route.ts` |
| Backend: autosave endpoint (called every 5s by ExamInterface) | `app/api/exam-sessions/answers/route.ts` |
| Backend: submit endpoint — persists final answers, auto-marks objective questions, writes the `results` row | `app/api/exam-sessions/submit/route.ts` |
| Backend: manual-grading endpoint — records a teacher's mark, rolls up `results` once a session is fully graded | `app/api/student-answers/grade/route.ts` |
| Student exam page wired to the above (device fingerprint, loading/error states) | `app/student/exam/[examId]/page.tsx` |

## Still to build
- **The entire Admin console is now wired to Supabase.** What's left is the
  Teacher side: Question Bank, Exam Builder, Grading Queue's data-fetching
  half (grading itself already calls `/api/student-answers/grade`), and
  Class Analytics. Same pattern throughout: fetch on mount with the browser
  client, mutate with `supabase.from(...)` (or a small API route when the
  anon key can't do it under RLS), `useAuthUser()` for the signed-in user's
  name/role.
- **Known gap**: creating a teacher doesn't populate `teacher_subjects` —
  that table needs a (teacher, subject, **class**) triple, and the People
  form only collects subjects, not which classes they're taught to. Needs
  its own assignment screen; for now the field is accepted in the UI but
  not persisted.
- Settings' logo upload still saves a `data:` URL straight into
  `school_profile.logo_url` rather than uploading to Supabase Storage first
  — fine for a demo, wasteful for production.

| Auth: real Supabase sign-in (student PIN + staff password), pre-auth admission-number lookup | `app/login/page.tsx`, `app/api/auth/resolve-student-email/route.ts`, `lib/supabase/admin.ts` |
| Auth: session-refresh + route-protection proxy (Next.js 16 renamed `middleware.ts` to `proxy.ts`) | `proxy.ts` |
| Auth: shared "who's signed in" hook, used instead of hardcoded userName props | `lib/useAuthUser.ts` |
| Schema: added the three tables Lab Batches/Settings needed (`lab_rooms`, `batch_templates`, singleton `school_profile`) + their RLS policies | `database/schema.sql` §8 |
| Admin: every screen (Overview, Classes & Subjects, Students & Teachers, Lab Batches, Results & Analytics, Settings, Report Cards) now runs on real Supabase queries — no more sample-data constants anywhere in `app/admin/**` | `app/admin/**/page.tsx` |
| Admin Overview's lab-conflict flagging is now computed for real (groups today's batches by `lab_room`, checks time-window overlap) rather than a hardcoded id list | `app/admin/page.tsx` |
| Fixed: `users` table had no self-read RLS policy — nothing after login could read its own role/name without it | `database/schema.sql` (`users_read_own` policy) |

**Every feature from the original brief is now built, and the entire Admin
console plus auth are wired end to end.** Remaining work: the four
Teacher-side screens above, the `teacher_subjects` gap, real Storage for
the school logo, and `npm i @react-pdf/renderer`.

Say "keep going" and I'll wire the Teacher screens next, or point me at a
specific one.
