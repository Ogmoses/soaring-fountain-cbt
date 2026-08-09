# Deploying from a phone — GitHub + Vercel

This is the phone-specific version of `DEPLOYMENT.md`, for the "no
computer at all" case. Supabase isn't covered here — that's happening
through the connector (see the note at the end).

**Which path to use depends on your phone**, because GitHub Codespaces —
the obvious "cloud computer in a browser" answer — turns out to not be
great on a phone. GitHub's own team has said mobile support isn't a
priority yet, and it shows: the editor isn't touch-optimized, and even
people who use it regularly route around the web UI with a terminal app
instead. So:

- **Android → use Termux.** Skips Codespaces (and its editor) entirely — you get a real Linux terminal on your phone and just push straight to GitHub from it. This is the more reliable path.
- **iPhone → GitHub Codespaces via Safari, with a Bluetooth keyboard if you can.** There's no Termux-equivalent on iOS. It'll feel cramped, but we only need to run about five short commands, not do real editing — that's exactly the case it holds up for.

Everything from Vercel onward is identical either way, and is just normal
mobile-web-browser clicking.

---

## Part 1A — Android, via Termux

1. Install **Termux** (F-Droid is the more reliably up-to-date source; the Play Store version works too).
2. Open it and run:
   ```bash
   pkg install git gh -y
   termux-setup-storage
   ```
   (Approve the storage permission prompt — this lets Termux see your phone's Downloads folder.)
3. In the chat with me, download `soaring-fountain-cbt.zip` (tap the file → Save/Download — it'll land in your phone's Downloads).
4. Back in Termux:
   ```bash
   cd storage/downloads
   unzip soaring-fountain-cbt.zip -d soaring-fountain-cbt
   cd soaring-fountain-cbt
   ```
5. Sign in to GitHub from the terminal:
   ```bash
   gh auth login
   ```
   Pick **GitHub.com** → **HTTPS** → **Login with a web browser**. It gives you a one-time code and opens a browser tab — enter the code there, approve, done. No password or token to manage by hand.
6. Create the repo and push, in one shot:
   ```bash
   gh repo create soaring-fountain-cbt --private --source=. --remote=origin --push
   ```
   That single command creates the GitHub repo, wires it as the remote, and pushes — `git init`/`add`/`commit` happen automatically as part of `--source=.`. If you'd rather do it in separate steps for clarity:
   ```bash
   git init
   git add -A
   git commit -m "Initial commit: Soaring Fountain CBT platform"
   gh repo create soaring-fountain-cbt --private --source=. --remote=origin
   git push -u origin main
   ```
7. Confirm: open github.com in your browser, check the new repo has all the folders (`app/`, `components/`, `lib/`, `database/`, etc.).

Skip to **Part 2**.

---

## Part 1B — iPhone, via GitHub Codespaces

1. In Safari (or Chrome), go to **github.com**, sign in, tap **+** → **New repository**. Name it `soaring-fountain-cbt`, leave it empty (no README), **Create repository**.
2. On the new repo's page, tap the green **Code** button → **Codespaces** tab → **Create codespace on main**. Wait ~30–60 seconds for it to spin up — you'll land in a browser-based VS Code with the Codespace already signed in as you on GitHub (nothing to authenticate later).
3. Switch tabs back to this chat and download `soaring-fountain-cbt.zip` to your phone.
4. Back in the Codespace tab: in the file **Explorer** panel (left side), find the **"···"** (more actions) menu at the top of the panel — it has an **Upload...** option. Use it to pick `soaring-fountain-cbt.zip` from your Files/Downloads. Wait for the upload to finish (it'll appear as a file in the Explorer).
5. Open a terminal: look for a hamburger/menu icon → **Terminal → New Terminal** (or a `>_`-style icon, depending on how the UI has laid itself out on your screen size).
6. In that terminal:
   ```bash
   unzip soaring-fountain-cbt.zip
   rm soaring-fountain-cbt.zip
   ls
   ```
   You should see `app/`, `components/`, `lib/`, `database/`, `package.json`, and the rest sitting directly in the root — not nested inside another folder.
7. Commit and push (already authenticated — no login step needed):
   ```bash
   git add -A
   git commit -m "Initial commit: Soaring Fountain CBT platform"
   git push
   ```
8. Refresh the repo's page in your other tab to confirm everything's there.

If Safari feels too cramped to manage this comfortably, Chrome for iOS
is worth trying instead — some people find it handles the Codespaces UI
a bit better. A Bluetooth keyboard makes step 6/7's typing much less
painful either way.

---

## Part 2 — Vercel (same on Android or iPhone)

1. Go to **vercel.com** in your mobile browser → sign up/in with **Continue with GitHub** (one tap, links the accounts).
2. **Add New...** → **Project**. First time, it'll ask to install/authorize the Vercel GitHub App — approve it, then select just the `soaring-fountain-cbt` repo (or "All repositories" if you'd rather).
3. Your repo should now show up in the import list — tap it.
4. Vercel auto-detects Next.js; you don't need to change the build settings.
5. Expand **Environment Variables**. **You can deploy now without these and add them once Supabase is ready** — the build will succeed either way, login just won't work until they're in. If you have them already, add all three (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) for **Production, Preview, and Development** all three.
6. Tap **Deploy**. A couple of minutes later you'll have a `https://<something>.vercel.app` URL.

**Adding the env vars later, once Supabase's ready:** Project → **Settings** →
**Environment Variables** → **Add New** for each of the three → save →
then **Deployments** tab → **···** on the latest one → **Redeploy**.

---

## Where Supabase fits in

I'm setting up the Supabase project directly through the connector once
you connect it with your existing account — creating it, running
`database/schema.sql`, and handing you back the three values for step 5
above. The one piece that'll still need a manual tap from you either way:
creating the very first Super Admin login, since that's an Authentication
dashboard action (Supabase's mobile web dashboard handles it fine — I'll
give you the exact steps once the project exists).

---

## Troubleshooting

**`gh: command not found` in Termux.** Run `pkg install gh -y` again —
first-time Termux setup sometimes needs `pkg update` run once before new
packages install cleanly.

**Codespace won't open / spins forever on iPhone.** Usually a flaky
connection more than a real error — close the tab and reopen the repo's
Codespaces tab. If it keeps failing, GitHub's free tier gives 120
core-hours/month, worth confirming you haven't already used them up on
something else.

**Upload... option isn't in the Explorer menu.** Try tapping and holding
on empty space inside the Explorer panel instead of the "···" menu — the
exact spot this lives in shifts slightly between Codespaces UI updates.

**Vercel doesn't list your repo.** The GitHub App wasn't given access to
it — go to github.com → Settings → Applications → Installed GitHub Apps
→ Vercel → Configure, and add the repo there.
