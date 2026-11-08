# whap · Clip Editing Marketplace for Page Owners & Video Editors

`whap` connects social page owners (**Account Holders**) who run TikTok, Instagram Reels, YouTube Shorts, and Facebook Reels pages with short-form **Video Editors** who want to edit clips and earn per 1,000 verified views without managing social accounts.

- **Editors** can sign up (passwordless Google or Email Magic Link + 1-screen onboarding) and submit a clip in under 2 minutes. Payout methods are never asked at signup; they are requested only when the editor's first earning appears.
- **Account Holders** launch campaigns, triage watermarked submissions one clip at a time in a mobile-first review queue, unlock clean master files upon selecting a clip, submit the live post URL within 72 hours, and log 7-day view snapshots.
- **Admins** resolve view-snapshot disputes, settle payouts with reference numbers and receipts, suspend bad actors, and configure global marketplace parameters.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend / Database / Storage:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
  - **Postgres + Row Level Security (RLS)** on every table (`supabase/migrations/0001_schema_and_rls.sql`)
  - **Storage with Resumable (TUS) Uploads** (`tus-js-client` to private bucket `submissions-raw`, chunked with local byte-offset checkpointing and automatic retry on network drops)
- **Validation:** Zod schemas (`src/lib/validation.ts`) on all user inputs
- **Testing:** Vitest (`npm test`)

---

## Setup & Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (`https://<project-ref>.supabase.co`). If omitted, `whap` automatically runs in self-contained Local/Preview Store mode pre-loaded with the full seed dataset. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anonymous key (enforces Postgres & Storage RLS). |
| `SUPABASE_SERVICE_ROLE_KEY` | Used by `npm run seed` and server-side signed URL generation for the private `submissions-raw` bucket. |
| `NEXT_PUBLIC_APP_URL` | Base URL for OAuth / Magic Link redirects (`http://localhost:3088` locally). |
| `RESEND_API_KEY` | Optional Resend API key for transactional email notifications. All emails are also logged in the in-app **Emails** outbox drawer for instant inspection. |

### 3. Apply SQL Migrations (Supabase)

Run the SQL migration in `supabase/migrations/0001_schema_and_rls.sql` via the Supabase SQL Editor or CLI:

```bash
supabase db push
```

This creates all 9 tables (`platform_settings`, `profiles`, `campaigns`, `submissions`, `view_snapshots`, `disputes`, `payout_requests`, `ledger_entries`, `notifications`), the database-level `calculate_clip_earnings_cents` function, private storage bucket `submissions-raw`, and Row Level Security policies on every table.

### 4. Run the Seed Script

```bash
npm run seed
```

`scripts/seed.ts` validates and seeds:
- **2 Account Holders:** `@apexclipspage` (Marcus Vance, dual-role `both`) and `@velvetgaminghq` (Elena Rostova)
- **5 Editors:** `@kenjicuts` (GCash configured, $21 withdrawable balance), `@mikaframes` ($5 first earning unlocked with no payout method set yet to demonstrate the first-earning payout collection banner), `@devonmotion` (paid clip + open view dispute), `@soravfx` (`revision_requested` and `resubmitted` clips), and `@tariqreels` (`selected` clip past 72h deadline + `rejected` clip)
- **1 Admin:** `@whap_admin`
- **3 Campaigns:** USD and PHP campaigns across Podcasts, Gaming, and AI & Tech
- **9 Submissions covering all 7 statuses:** `submitted`, `revision_requested`, `resubmitted`, `selected`, `posted`, `paid`, and `rejected`

### 5. Start the App

```bash
npm run dev
```

Open `http://localhost:3088`. Use the **Role Switcher** (`Editor` / `Holder` / `Admin`) or the **Persona Switcher** in the top navigation bar to test every role and user state in one click.

---

## Payout Math Specification

All monetary amounts are stored as **integer cents** (`100` cents = `$1.00` USD or `₱1.00` PHP) to eliminate floating-point rounding drift. Currency is configured per campaign (`USD` default, `PHP` supported).

### 1. Per-Clip Formula

When an Account Holder selects a clip, the campaign's rate is locked on the submission (`locked_rate_per_1k_cents`, `locked_base_fee_cents`, `locked_max_payout_cents`). As verified view snapshots arrive inside the campaign's tracking window (default 30 days after posting), earnings are calculated as:

```text
raw_view_bonus_cents    = round((counted_views / 1000) * locked_rate_per_1k_cents)
capped_view_bonus_cents = min(raw_view_bonus_cents, locked_max_payout_cents)
uncapped_clip_cents     = locked_base_fee_cents + capped_view_bonus_cents
```

### 2. Campaign Budget Cap Enforcement

Each campaign defines a `total_budget_cap_cents`. Let `other_clips_accrued_cents` be the sum of `gross_earnings_cents` across all other `selected`, `posted`, and `paid` clips in the campaign:

```text
remaining_budget_before_clip = max(0, total_budget_cap_cents - other_clips_accrued_cents)
gross_earnings_cents         = min(uncapped_clip_cents, remaining_budget_before_clip)
```

Accrual stops automatically when `remaining_budget_cents` reaches `0`. The remaining campaign budget is displayed live on every campaign card, campaign detail page, and review queue view.

### 3. Platform Fee & Net Earnings

`platform_fee_percent` is configurable in Admin Settings (default `0%`):

```text
platform_fee_cents = round(gross_earnings_cents * (platform_fee_percent / 100))
net_earnings_cents = gross_earnings_cents - platform_fee_cents
```

### Worked Examples (Verified by `npm test`)

1. **Standard Accrual (`sub-6` on `camp-1`):**
   - Rate: `$1.50 / 1k views` (`150` cents), Base fee: `$5.00` (`500` cents), Max view bonus per clip: `$60.00` (`6000` cents), Counted views: `24,000`.
   - `view_bonus = (24,000 / 1,000) * 150 = 3,600` cents (`$36.00`).
   - `earnings = 500 + min(3,600, 6,000) = 4,100` cents (`$41.00`).
2. **Per-Clip Max Payout Cap Reached (`sub-8` on `camp-1`):**
   - Counted views: `45,000` -> `raw_view_bonus = 45 * 150 = 6,750` cents (`$67.50`).
   - Capped at `max_payout_per_clip = 6,000` cents (`$60.00`) + `500` cents base fee = `6,500` cents (`$65.00`).
3. **Campaign Budget Cap Reached:**
   - If a clip's formula yields `$65.00` (`6500` cents) but the campaign only has `$18.00` (`1800` cents) of remaining budget, the clip's gross earnings are clamped to `1800` cents (`$18.00`) and the campaign's remaining budget becomes `$0.00`.
