# Deploying the Soaring Fountain CBT Platform

A complete path from the files in this project to a live URL, using
**GitHub** (source control + CI trigger), **Supabase** (database, auth,
storage), and **Vercel** (hosting — made by the Next.js team, so it has
the simplest possible GitHub integration for this stack). If you'd rather
host elsewhere, everything through Part D is identical; only Part G
changes — any Node.js host that supports Next.js's App Router works
(Netlify, Render, a plain VPS with `next start`).

This guide is written for **Next.js 16** (current stable as of writing),
which recently renamed `middleware.ts` to `proxy.ts` — the project files
already use the new name, so this is just so nothing looks surprising
later.

---

## What you'll end up with

- A Supabase project holding the database (`database/schema.sql`), auth
  users, and file storage.
- This code on GitHub.
- A live Vercel deployment that redeploys automatically on every push to
  `main`.
- One working Super Admin login you created by hand — everyone else gets
  created *through the app* from that point on.

## Prerequisites

- **Accounts**: [GitHub](https://github.com), [Supabase](https://supabase.com), [Vercel](https://vercel.com) — free tiers are enough to deploy and test this.
- **Locally installed**: [Node.js](https://nodejs.org) 20.9 or later, `git`, and a terminal.
- Check your Node version before starting:
  ```bash
  node -v
  ```

---

## Part A — Scaffold the Next.js project

You already have every source file (`app/`, `components/`, `lib/`,
`database/schema.sql`, `package.json`, `tsconfig.json`, `next.config.ts`,
`tailwind.config.ts`, `postcss.config.js`, `proxy.ts`, `.env.example`,
`.gitignore`) in the folder this guide shipped alongside. If that folder
is already on your machine, skip to Part B.

If you're starting from a fresh checkout instead, put all of those files
in one project folder — the layout matters, since everything imports with
the `@/` alias from the project root (e.g. `@/components/layout/Sidebar`
resolves to `./components/layout/Sidebar.tsx`).

---

## Part B — Install dependencies and add fonts

From the project root:

```bash
npm install
```

This reads `package.json` and installs Next.js, React, Tailwind,
`@supabase/ssr`, `@supabase/supabase-js`, `@react-pdf/renderer`,
`framer-motion`, and `lucide-react` in one go.

**Add the PDF font files** (the web UI uses Google Fonts automatically via
`next/font`, but the PDF report-card generator needs real font files on
disk — see `public/fonts/README.md` for the exact three files and where
to get them from Google Fonts). Report cards will fail to generate until
this step is done; nothing else in the app depends on it, so it's safe to
come back to later.

Sanity-check everything so far:

```bash
npm run build
```

This will fail right now — there's no Supabase project or environment
variables yet, and pages that fetch data at build/request time need them.
That's expected; continue to Part C.

---

## Part C — Create and configure the Supabase project

### 1. Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick an organization, name the project (e.g. `soaring-fountain-cbt`), set a strong database password (save it somewhere — you'll rarely need it directly, but you'll want it if you ever connect a raw Postgres client), and pick the region closest to the school.
3. Wait for provisioning to finish (a minute or two).

### 2. Run the database schema

1. In the project, open the **SQL Editor** (left sidebar).
2. Open `database/schema.sql` from this project, copy the **entire file**, paste it into a new SQL Editor query, and click **Run**.
3. You should see it succeed with no errors. If something fails partway, the error message names the exact line/statement — the most likely cause is running it twice (tables already exist); drop the tables or start a fresh project rather than partially re-running it.

This creates every table, enum, and Row Level Security policy the app
depends on — including `lab_rooms`, `batch_templates`, and
`school_profile`, which the Admin console's Lab Batches and Settings
screens read from immediately.

### 3. Get your API keys

Open **Settings → API Keys**. Supabase is mid-migration from the old
`anon` / `service_role` key names to new `publishable` / `secret` keys
(same purpose, new format, and the legacy names are being phased out) —
this project's code uses the new names, so:

- If you see a **Publishable key** and **Secret key** section already: copy both.
- If you only see **Legacy API Keys** (an older project): click **Create new API keys** to generate the new ones alongside your existing legacy keys — this doesn't disable anything you already have.

Also copy the **Project URL** from the same page (or the **Connect**
dialog). You'll need all three in Part E.

> **The secret key is not like the publishable key.** It bypasses every
> Row Level Security policy in `database/schema.sql`. It belongs in
> exactly one place in this project — the server-only environment
> variable `SUPABASE_SECRET_KEY` — and nowhere else. Never in a client
> component, never in a public repo, never pasted into a chat.

### 4. Bootstrap the first Super Admin

Every account in this app — including admins — normally gets created
*through the app* (Admin → Students & Teachers), which requires being
signed in as a Super Admin already. The very first one has to be created
by hand, once:

1. **Authentication → Users → Add user** (button wording may vary
   slightly by dashboard version — look for a way to manually create a
   user). Enter an email and password, and check any "auto confirm" /
   "email confirmed" option if offered, so you're not stuck waiting on a
   confirmation email that hasn't been configured yet.
2. Copy the new user's **UID** shown in the users list.
3. Back in the **SQL Editor**, run (replacing the placeholders):
   ```sql
   insert into public.users (id, role, full_name, email, is_active)
   values ('paste-the-uid-here', 'super_admin', 'Your Name', 'the-email-you-used@example.com', true);
   ```
4. That's your login for `/login` → "Teacher / Admin" tab, once the app is running.

Skipping this step means the admin login always fails with "not found" —
`app/api/admin/people/route.ts` and every admin screen check the `users`
table for a `super_admin` row, and there won't be one yet.

### 5. (Optional now, required before real use) Auth URL configuration

**Authentication → URL Configuration** → set **Site URL** to
`http://localhost:3000` for now; you'll change this to your real domain
in Part H once it exists. This project only uses email+password sign-in
today (no magic links or OAuth), so this setting doesn't block anything
locally — it matters once you add either.

---

## Part D — Local environment variables

```bash
cp .env.example .env.local
```

Fill in the three values from Part C.3:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxx
```

`.env.local` is already in `.gitignore` — it will never be committed.

---

## Part E — Test it locally

```bash
npm run dev
```

Visit `http://localhost:3000` — it redirects straight to `/login`.

A quick smoke test, in order:

1. **Sign in** with the Super Admin you bootstrapped in Part C.4 → lands on `/admin`.
2. **Classes & Subjects** → add a class (e.g. "JSS1") and a subject.
3. **Students & Teachers** → add one teacher. A dialog shows a generated
   temporary password **once** — that's real, it's how that person will
   sign in on the "Teacher / Admin" tab at `/login`.
4. **Lab Batches** → add a lab room and a batch template — confirms the
   three tables added in `database/schema.sql` §8 are working.
5. Sign out, sign back in as the teacher you just created, confirm you
   land on `/teacher` and can open **Question Bank**.

If all five work, the whole stack — Next.js, Supabase Auth, RLS, and the
admin API routes — is wired correctly end to end.

---

## Part F — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Soaring Fountain CBT platform"
```

Create an empty repository on GitHub (no README/license — you already
have files), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

Double-check `.env.local` did **not** get committed:

```bash
git ls-files | grep env
```

This should print nothing (or only `.env.example`). If `.env.local`
shows up, it was committed before `.gitignore` took effect — remove it
from history before making the repo public, and rotate your Supabase keys
in the dashboard as a precaution.

---

## Part G — Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** your GitHub repo (authorize Vercel's GitHub App if this is your first time).
2. Vercel auto-detects Next.js — leave the build settings on their defaults.
3. **Environment Variables** — add the same three from Part D. Do this for **all three environments Vercel offers (Production, Preview, Development)** so preview deployments on pull requests work too:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
4. **Deploy.** First build takes a couple of minutes.
5. You'll get a `https://<project>.vercel.app` URL — open it, confirm it redirects to `/login`, and sign in as your Super Admin.

---

## Part H — Point Supabase at the real domain

Back in Supabase → **Authentication → URL Configuration**:

- **Site URL** → your Vercel URL (`https://<project>.vercel.app`, or a custom domain if you've attached one in Vercel's Domains tab).
- **Redirect URLs** → add the same URL if you later add magic links, OAuth, or password-reset emails — not required for the email+password flow this app ships with today, but one less thing to debug when you do add one of those.

---

## Part I — Ongoing deploys

From here, this is the whole workflow:

```bash
git add .
git commit -m "whatever you changed"
git push
```

Vercel's GitHub integration picks up the push and redeploys automatically
— nothing else to run. Opening a pull request instead of pushing straight
to `main` gets you a preview URL to test on before merging.

---

## Troubleshooting

**Login says "Incorrect email or password" for an account you know is right.**
Check you're on the correct tab (Student vs. Teacher/Admin) — students
sign in with admission number + PIN, staff with email + password; the two
flows hit different endpoints.

**A page loads but every list is empty, even though you added data.**
Almost always a Row Level Security policy blocking the read. Confirm
you're signed in as the role the page expects, and that
`database/schema.sql` ran completely (Part C.2) — the `users_read_own`
policy in particular is easy to miss if the script was only partially run.

**"Only an admin can manage accounts" when you're sure you're an admin.**
The `public.users` row is what the API routes check, not just having an
`auth.users` session — confirm the bootstrap insert in Part C.4 actually
used `role = 'super_admin'` and the right UID.

**Report card download 500s / PDF looks unstyled.**
The three `.ttf` files from `public/fonts/README.md` aren't there yet —
`Font.register` in `ReportCardDocument.tsx` has nothing to load.

**`next build` or `next dev` complains about `proxy.ts` / middleware.**
Confirm you're on Next.js 16 (`npx next --version`) — this project's
route-protection file uses the `proxy.ts` convention Next.js 16
introduced (renamed from `middleware.ts`). On Next.js 15 or earlier,
rename it back to `middleware.ts` and rename the exported `proxy`
function back to `middleware`.

**Creating a student/teacher account fails with an auth error.**
Check `SUPABASE_SECRET_KEY` is set correctly in whichever environment
you're testing (local `.env.local`, or Vercel's env vars) — account
creation runs through `lib/supabase/admin.ts`, which needs it.

**Bulk CSV import says some rows failed.**
By design — one bad row (usually a duplicate email) doesn't block the
rest. The response names which rows failed and why; see the `// TODO` in
`app/admin/people/page.tsx` about surfacing that detail directly in the
UI instead of a summary line.

---

## Security checklist before real students/staff use this

- [ ] `SUPABASE_SECRET_KEY` only exists in `.env.local` (gitignored) and Vercel's server-side env vars — never in a `NEXT_PUBLIC_` variable, never committed.
- [ ] Every table in `database/schema.sql` has Row Level Security **enabled** — the script does this, but confirm after running it: Supabase's Table Editor flags any table with RLS off.
- [ ] The Supabase database password from Part C.1 is stored somewhere real (a password manager), not just in your terminal history.
- [ ] Rotate the Supabase keys once (Settings → API Keys) if this repo was ever public with a real `.env.local` committed, even briefly.
- [ ] Change the Super Admin's bootstrap password (Part C.4) to something you don't want to remember — you won't need to log in with it often once you've created other admins through the app.
