# Fonts for PDF report cards

`components/reports/ReportCardDocument.tsx` registers Plus Jakarta Sans
with `@react-pdf/renderer`, which — unlike the rest of the app — can't use
`next/font/google`. It needs real `.ttf` files sitting on disk. Without
them, `/api/report-cards/[studentId]/[termId]` will throw at request time.

Download these three weights from Google Fonts and put them in this exact
folder with these exact names (matching `Font.register` in
`ReportCardDocument.tsx`):

1. Go to https://fonts.google.com/specimen/Plus+Jakarta+Sans
2. Click "Download family" (top right)
3. Unzip it, and from the `static/` folder copy:
   - `PlusJakartaSans-Regular.ttf`
   - `PlusJakartaSans-SemiBold.ttf`
   - `PlusJakartaSans-Bold.ttf`
4. Drop all three directly into this `public/fonts/` folder.

That's it — no code changes needed, the paths already match.
