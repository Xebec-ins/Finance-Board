# Budget

A personal finance app: set a monthly spending budget and savings goal, log
spending manually or from a receipt photo (auto-read with in-browser OCR),
and see charts of where the money goes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase — Postgres, Auth, and Storage (receipt photos)
- Tesseract.js — OCR runs fully in the browser, no API key or server cost
- Recharts — charts

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's ready, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, row-level
   security policies, the `receipts` storage bucket, and a trigger that seeds
   default categories for each new user.
3. Open **Settings → API** and copy the **Project URL** and **anon/public key**.
4. By default Supabase requires email confirmation for new accounts. For local
   testing you can turn this off under **Authentication → Providers → Email →
   Confirm email**, or just confirm via the email that gets sent.

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the two values from step 1:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, set a budget in
Settings, then add spending manually or by photo from the Transactions page.

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo.
3. Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) under **Settings → Environment Variables**.
4. Deploy. No other configuration is needed — OCR runs client-side and receipt
   photos live in Supabase Storage, not in the deployment.
5. In Supabase, add your Vercel production URL (and any preview URLs you use)
   under **Authentication → URL Configuration** so auth redirects work there too.

## Notes

- Receipt OCR is a best-effort suggestion — always double-check the amount
  before saving; it's editable right up to submit.
- The savings goal progress on the dashboard is based on how much of this
  month's spending budget is left unspent, not a separate savings account.
