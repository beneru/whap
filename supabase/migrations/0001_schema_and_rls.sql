-- ============================================================================
-- whap: Clip Editing Marketplace Schema, Triggers, Storage & Row Level Security
-- Migration: 0001_schema_and_rls.sql
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PLATFORM SETTINGS (Singleton ID = 1)
-- ----------------------------------------------------------------------------
create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  platform_fee_percent numeric(5,2) not null default 0.00 check (platform_fee_percent >= 0 and platform_fee_percent <= 50),
  min_payout_cents integer not null default 1000 check (min_payout_cents >= 100),
  post_deadline_hours integer not null default 72 check (post_deadline_hours >= 1),
  view_update_interval_days integer not null default 7 check (view_update_interval_days >= 1),
  default_tracking_window_days integer not null default 30 check (default_tracking_window_days >= 1),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, platform_fee_percent, min_payout_cents, post_deadline_hours, view_update_interval_days, default_tracking_window_days)
values (1, 0.00, 1000, 72, 7, 30)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. PROFILES (Account Holders, Editors, Both, Admins)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  display_name text not null,
  role text not null default 'editor' check (role in ('editor', 'account_holder', 'both', 'admin')),
  active_role text not null default 'editor' check (active_role in ('editor', 'account_holder', 'admin')),
  bio text default '',
  avatar_url text,
  niches text[] not null default '{}',
  portfolio_url text,
  sample_clip_urls text[] not null default '{}',
  -- Payout method is collected ONLY when the editor's first earning appears, NOT at signup
  payout_method_type text check (payout_method_type in ('gcash', 'paypal', 'bank')),
  payout_method_details jsonb,
  suspended boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_username on public.profiles(username);

-- Helper function to check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'admin' or active_role = 'admin') and suspended = false
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. CAMPAIGNS
-- ----------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  brief text not null,
  niche text not null,
  source_links text[] not null default '{}',
  platforms text[] not null check (array_length(platforms, 1) >= 1),
  target_page_handles text[] not null default '{}',
  aspect_ratio text not null default '9:16',
  min_length_sec integer not null default 15 check (min_length_sec > 0),
  max_length_sec integer not null default 60 check (max_length_sec >= min_length_sec),
  captions_required boolean not null default true,
  hook_notes text not null default '',
  currency text not null default 'USD' check (currency in ('USD', 'PHP')),
  rate_per_1k_cents integer not null check (rate_per_1k_cents >= 0),
  base_fee_cents integer not null default 0 check (base_fee_cents >= 0),
  max_payout_per_clip_cents integer not null check (max_payout_per_clip_cents > 0),
  total_budget_cap_cents integer not null check (total_budget_cap_cents > 0),
  clips_needed integer not null default 5 check (clips_needed > 0),
  submission_deadline timestamptz not null,
  view_tracking_window_days integer not null default 30 check (view_tracking_window_days > 0),
  post_deadline_hours integer not null default 72 check (post_deadline_hours > 0),
  max_submissions_per_editor integer not null default 3 check (max_submissions_per_editor > 0),
  status text not null default 'open' check (status in ('draft', 'open', 'closed', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_owner on public.campaigns(owner_id);
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_niche on public.campaigns(niche);

-- ----------------------------------------------------------------------------
-- 4. SUBMISSIONS
-- ----------------------------------------------------------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  editor_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('upload', 'link')),
  storage_path text,
  external_link text,
  file_name text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes <= 524288000), -- max 500MB
  duration_sec integer not null default 30,
  suggested_caption text default '',
  hashtags text[] not null default '{}',
  notes text default '',
  status text not null default 'submitted' check (
    status in ('submitted', 'revision_requested', 'resubmitted', 'selected', 'posted', 'paid', 'rejected')
  ),
  revision_note text,
  rejection_reason text,
  selected_at timestamptz,
  post_deadline_at timestamptz,
  missed_post_deadline boolean not null default false,
  clean_file_unlocked boolean not null default false,
  locked_rate_per_1k_cents integer,
  locked_base_fee_cents integer,
  locked_max_payout_cents integer,
  posted_url text,
  posted_platform text,
  posted_at timestamptz,
  tracking_ends_at timestamptz,
  last_view_update_at timestamptz,
  counted_views integer not null default 0 check (counted_views >= 0),
  gross_earnings_cents integer not null default 0 check (gross_earnings_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  net_earnings_cents integer not null default 0 check (net_earnings_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_submissions_campaign on public.submissions(campaign_id);
create index if not exists idx_submissions_editor on public.submissions(editor_id);
create index if not exists idx_submissions_status on public.submissions(status);

-- ----------------------------------------------------------------------------
-- 5. VIEW SNAPSHOTS
-- ----------------------------------------------------------------------------
create table if not exists public.view_snapshots (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  views integer not null check (views >= 0),
  source text not null default 'manual' check (source in ('manual', 'api')),
  proof_url text not null,
  note text,
  verified boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_snapshots_submission on public.view_snapshots(submission_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 6. DISPUTES
-- ----------------------------------------------------------------------------
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.view_snapshots(id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  against_user_id uuid not null references public.profiles(id),
  reason text not null,
  claimed_views integer not null check (claimed_views >= 0),
  evidence_url text,
  status text not null default 'open' check (status in ('open', 'resolved_upheld', 'resolved_overturned')),
  resolution_note text,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_disputes_status on public.disputes(status);
create index if not exists idx_disputes_against on public.disputes(against_user_id);

-- ----------------------------------------------------------------------------
-- 7. PAYOUT REQUESTS
-- ----------------------------------------------------------------------------
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  account_holder_id uuid references public.profiles(id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD' check (currency in ('USD', 'PHP')),
  payout_method_type text not null check (payout_method_type in ('gcash', 'paypal', 'bank')),
  payout_method_summary text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  reference_number text,
  receipt_url text,
  paid_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_payouts_editor on public.payout_requests(editor_id);
create index if not exists idx_payouts_holder on public.payout_requests(account_holder_id);

-- ----------------------------------------------------------------------------
-- 8. LEDGER ENTRIES (Immutable Financial Audit Trail)
-- ----------------------------------------------------------------------------
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  submission_id uuid references public.submissions(id) on delete set null,
  payout_request_id uuid references public.payout_requests(id) on delete set null,
  entry_type text not null check (entry_type in ('earning', 'payout', 'adjustment')),
  amount_cents integer not null,
  currency text not null default 'USD' check (currency in ('USD', 'PHP')),
  balance_after_cents integer not null,
  description text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_ledger_user on public.ledger_entries(user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATIONS (In-App + Email Outbox Audit)
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'new_submission',
      'clip_selected',
      'clip_rejected',
      'revision_requested',
      'post_url_added',
      'view_update',
      'missed_posting_deadline',
      'payout_requested',
      'payout_paid',
      'dispute_opened',
      'dispute_resolved'
    )
  ),
  title text not null,
  body text not null,
  action_url text not null default '/',
  email_sent boolean not null default true,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, read, created_at desc);

-- ============================================================================
-- PAYOUT MATH FUNCTION (Database-level enforcement)
-- earnings = base_fee + min(counted_views / 1000 * rate_per_1k, max_payout_per_clip)
-- Clamped by remaining campaign budget cap
-- ============================================================================
create or replace function public.calculate_clip_earnings_cents(
  p_counted_views integer,
  p_rate_per_1k_cents integer,
  p_base_fee_cents integer,
  p_max_payout_per_clip_cents integer,
  p_remaining_campaign_budget_cents integer
)
returns integer
language plpgsql
immutable
as $$
declare
  v_view_bonus_cents integer;
  v_uncapped_clip_cents integer;
begin
  v_view_bonus_cents := least(
    round((greatest(p_counted_views, 0)::numeric / 1000.0) * p_rate_per_1k_cents)::integer,
    p_max_payout_per_clip_cents
  );
  v_uncapped_clip_cents := p_base_fee_cents + v_view_bonus_cents;
  return greatest(0, least(v_uncapped_clip_cents, p_remaining_campaign_budget_cents));
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) ON EVERY TABLE
-- ============================================================================
alter table public.platform_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.submissions enable row level security;
alter table public.view_snapshots enable row level security;
alter table public.disputes enable row level security;
alter table public.payout_requests enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.notifications enable row level security;

-- 1. platform_settings RLS
create policy "platform_settings_read_all" on public.platform_settings
  for select using (true);

create policy "platform_settings_admin_update" on public.platform_settings
  for update using (public.is_admin());

-- 2. profiles RLS
create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- 3. campaigns RLS (Browsable logged out; owner or admin can mutate)
create policy "campaigns_select_public" on public.campaigns
  for select using (status <> 'draft' or owner_id = auth.uid() or public.is_admin());

create policy "campaigns_insert_holder" on public.campaigns
  for insert with check (auth.uid() = owner_id or public.is_admin());

create policy "campaigns_update_owner_or_admin" on public.campaigns
  for update using (auth.uid() = owner_id or public.is_admin());

create policy "campaigns_delete_owner_or_admin" on public.campaigns
  for delete using (auth.uid() = owner_id or public.is_admin());

-- 4. submissions RLS (Visible to submitting editor, campaign owner, or admin)
create policy "submissions_select_involved" on public.submissions
  for select using (
    editor_id = auth.uid()
    or exists (select 1 from public.campaigns c where c.id = submissions.campaign_id and c.owner_id = auth.uid())
    or public.is_admin()
  );

create policy "submissions_insert_editor" on public.submissions
  for insert with check (auth.uid() = editor_id);

create policy "submissions_update_involved" on public.submissions
  for update using (
    editor_id = auth.uid()
    or exists (select 1 from public.campaigns c where c.id = submissions.campaign_id and c.owner_id = auth.uid())
    or public.is_admin()
  );

-- 5. view_snapshots RLS (Visible to editor, campaign owner, or admin)
create policy "view_snapshots_select_involved" on public.view_snapshots
  for select using (
    exists (
      select 1 from public.submissions s
      join public.campaigns c on c.id = s.campaign_id
      where s.id = view_snapshots.submission_id
        and (s.editor_id = auth.uid() or c.owner_id = auth.uid())
    )
    or public.is_admin()
  );

create policy "view_snapshots_insert_holder_or_admin" on public.view_snapshots
  for insert with check (
    exists (
      select 1 from public.campaigns c
      where c.id = view_snapshots.campaign_id and c.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- 6. disputes RLS
create policy "disputes_select_involved" on public.disputes
  for select using (
    opened_by = auth.uid()
    or against_user_id = auth.uid()
    or public.is_admin()
  );

create policy "disputes_insert_editor" on public.disputes
  for insert with check (opened_by = auth.uid());

create policy "disputes_update_admin" on public.disputes
  for update using (public.is_admin());

-- 7. payout_requests RLS
create policy "payout_requests_select_involved" on public.payout_requests
  for select using (
    editor_id = auth.uid()
    or account_holder_id = auth.uid()
    or public.is_admin()
  );

create policy "payout_requests_insert_editor" on public.payout_requests
  for insert with check (editor_id = auth.uid());

create policy "payout_requests_update_holder_or_admin" on public.payout_requests
  for update using (
    account_holder_id = auth.uid()
    or public.is_admin()
  );

-- 8. ledger_entries RLS
create policy "ledger_entries_select_own_or_admin" on public.ledger_entries
  for select using (user_id = auth.uid() or public.is_admin());

create policy "ledger_entries_insert_authenticated" on public.ledger_entries
  for insert with check (user_id = auth.uid() or public.is_admin() or created_by = auth.uid());

-- 9. notifications RLS
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid() or public.is_admin());

create policy "notifications_insert_authenticated" on public.notifications
  for insert with check (auth.uid() is not null or public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS & RLS (Private bucket for raw submissions, proofs bucket)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('submissions-raw', 'submissions-raw', false, 524288000, array['video/mp4', 'video/quicktime']),
  ('proofs-and-receipts', 'proofs-and-receipts', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "submissions_raw_upload_editor" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'submissions-raw' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "submissions_raw_read_owner_or_selected_holder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submissions-raw'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or exists (
        select 1 from public.submissions s
        join public.campaigns c on c.id = s.campaign_id
        where s.storage_path = storage.objects.name
          and c.owner_id = auth.uid()
      )
    )
  );
