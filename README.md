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
- **Known gap**: creating a teacher doesn't populate `teacher_subjects` —
  that table needs a (teacher, subject, **class**) triple, and the People
  form only collects subjects, not which classes they're taught to. Needs
  its own assignment screen; for now the field is accepted in the UI but
  not persisted.
- Settings' logo upload still saves a `data:` URL straight into
  `school_profile.logo_url` rather than uploading to Supabase Storage first
  — fine for a demo, wasteful for production.
- Report card PDFs need the three Plus Jakarta Sans `.ttf` files added
  manually (see `public/fonts/README.md`) — not yet done as of this build.
- Supabase's **Leaked Password Protection** (checks new passwords against
  HaveIBeenPwned) is off by default and isn't something the project-level
  connector can toggle — Dashboard → Authentication → Policies to enable it.
- Minor performance-only lints remain (a few unindexed foreign keys, some
  policies that re-evaluate `auth.uid()` per row instead of once per query)
  — fine at this school's scale, not worth the migration churn yet.

| Auth: real Supabase sign-in (student PIN + staff password), pre-auth admission-number lookup | `app/login/page.tsx`, `app/api/auth/resolve-student-email/route.ts`, `lib/supabase/admin.ts` |
| Auth: session-refresh + route-protection proxy (Next.js 16 renamed `middleware.ts` to `proxy.ts`) | `proxy.ts` |
| Auth: shared "who's signed in" hook, used instead of hardcoded userName props | `lib/useAuthUser.ts` |
| Schema: added the three tables Lab Batches/Settings needed (`lab_rooms`, `batch_templates`, singleton `school_profile`) + their RLS policies | `database/schema.sql` §8 |
| Admin: every screen now runs on real Supabase queries | `app/admin/**/page.tsx` |
| Teacher: every screen (Question Bank, Exam Builder, Grading Queue, Class Analytics) now runs on real Supabase queries | `app/teacher/**/page.tsx` |
| Student: Exam Launchpad now shows the signed-in student's actual batches/results, not hardcoded sample data | `app/student/page.tsx` |
| Exam Builder: added the missing `isTerminal` toggle — without it, every exam defaulted to "not terminal" and report cards' Terminal column would always show 0 | `components/teacher/ExamBuilder.tsx` |

**Critical fixes found via Supabase's own security linter and a full RLS
audit** (these were live bugs, not applied to a copy — caught after the
first real deploy):
- 8 tables had **no RLS policy at all** (`academic_sessions`, `terms`,
  `classes`, `subjects`, `class_subjects`, `teacher_subjects`,
  `exam_questions`, `grading_scale`) — wide open to the publishable key.
  4 more (`exams`, `exam_batches`, `batch_students`, `term_subject_results`)
  had RLS *enabled* with zero policies — locked shut, even for admins.
- `question_options` was the same "locked shut" case — fixed by design to
  stay that way for direct client reads (`is_correct` must never be
  queryable by a student), with app code reading it via the service-role
  client instead.
- **The exam-taking flow itself was broken**: `/api/exam-sessions/start`,
  `/answers`, and `/submit` all queried `questions`/`question_options`
  using the RLS-bound client — but students have no SELECT policy on
  either table. In practice this meant empty exams, autosave silently
  mis-filing every multiple-choice answer as free text, and every
  objective question auto-graded as wrong regardless of the real answer.
  All three routes now use the service-role client, since each already
  re-implements its own authorization in code (batch window, roster,
  single-session enforcement) — that's the real boundary, not RLS.
- `/api/student-answers/grade` had the identical issue for the *write*
  side: a teacher grading another student's answer would have the update
  silently affect zero rows under RLS — no error, nothing saved. Same fix.
- Added a `teacher_read_student_answers` policy so Grading Queue and Class
  Analytics can read (never write) other students' answers directly —
  the one case where extending RLS was cleaner than another API route.

**Every screen across all three portals is now wired to real Supabase —
none of the sample-data constants from earlier passes remain anywhere in
`app/`.** What's left is the small items above, plus the DB needing real
content: as of this deploy it has zero users, zero classes, zero of
everything (the grading scale defaults are now seeded). Bootstrapping the
first Super Admin is the one manual step nothing else can substitute for.
