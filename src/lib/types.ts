export type UserRole = 'editor' | 'account_holder' | 'both' | 'admin';
export type ActiveRole = 'editor' | 'account_holder' | 'admin';

export type CurrencyCode = 'USD' | 'PHP';

export type PlatformId = 'tiktok' | 'ig_reels' | 'youtube_shorts' | 'fb_reels';
export type PlatformType = PlatformId;

export type CampaignStatus = 'draft' | 'open' | 'closed' | 'completed';

export type SubmissionStatus =
  | 'submitted'
  | 'revision_requested'
  | 'resubmitted'
  | 'selected'
  | 'posted'
  | 'paid'
  | 'rejected';

export type PayoutMethodType = 'gcash' | 'paypal' | 'bank' | 'stripe';

export type DisputeStatus = 'open' | 'resolved_upheld' | 'resolved_overturned';

export type PayoutRequestStatus = 'pending' | 'paid' | 'rejected' | 'requested';
export type PayoutStatus = PayoutRequestStatus;

export type LedgerEntryType = 'earning' | 'payout' | 'adjustment' | 'deposit';

export type NotificationType =
  | 'new_submission'
  | 'clip_selected'
  | 'clip_rejected'
  | 'revision_requested'
  | 'post_url_added'
  | 'view_update'
  | 'missed_posting_deadline'
  | 'payout_requested'
  | 'payout_paid'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'escrow_locked'
  | 'escrow_deposited'
  | 'base_fee_paid'
  | 'kill_fee_paid'
  | 'rights_reverted';

export interface PayoutMethodDetails {
  type: PayoutMethodType;
  gcash_number?: string;
  gcash_name?: string;
  paypal_email?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_account_holder?: string;
  stripe_account_id?: string;
  stripe_email?: string;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: UserRole;
  active_role: ActiveRole;
  bio: string;
  avatar_url?: string;
  niches: string[];
  portfolio_url?: string;
  sample_clip_urls: string[];
  payout_method_type: PayoutMethodType | null;
  payout_method_details: PayoutMethodDetails | null;
  suspended: boolean;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountHolderReputation {
  holder_id: string;
  campaigns_run: number;
  clips_selected: number;
  total_paid_out_cents: number;
  on_time_post_percent: number;
  disputes_count: number;
  missed_deadlines_count: number;
}

export type InstructionAssetType = 'link' | 'image' | 'audio' | 'file';

export interface InstructionAsset {
  id: string;
  type: InstructionAssetType;
  title: string;
  url: string;
  file_name?: string;
  file_size_bytes?: number;
  note?: string;
}

export interface Campaign {
  id: string;
  owner_id: string;
  title: string;
  brief: string;
  niche: string;
  source_links: string[];
  instruction_assets?: InstructionAsset[];
  platforms: PlatformId[];
  target_page_handles: string[];
  aspect_ratio: '9:16' | '1:1' | '16:9' | '4:5';
  min_length_sec: number;
  max_length_sec: number;
  captions_required: boolean;
  hook_notes: string;
  currency: CurrencyCode;
  rate_per_1k_cents: number;
  base_fee_cents: number;
  max_payout_per_clip_cents: number;
  total_budget_cap_cents: number;
  clips_needed: number;
  submission_deadline: string;
  view_tracking_window_days: number;
  post_deadline_hours: number;
  max_submissions_per_editor: number;
  status: CampaignStatus;
  funded_escrow_cents?: number;
  held_escrow_cents?: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  campaign_id: string;
  editor_id: string;
  source_type: 'upload' | 'link';
  storage_path: string | null;
  external_link: string | null;
  preview_video_url?: string;
  file_name: string | null;
  file_size_bytes: number | null;
  duration_sec: number;
  suggested_caption: string;
  hashtags: string[];
  notes: string;
  status: SubmissionStatus;
  revision_note: string | null;
  rejection_reason: string | null;
  selected_at: string | null;
  post_deadline_at: string | null;
  missed_post_deadline: boolean;
  clean_file_unlocked: boolean;
  locked_rate_per_1k_cents: number | null;
  locked_base_fee_cents: number | null;
  locked_max_payout_cents: number | null;
  held_escrow_cents?: number;
  base_fee_paid?: boolean;
  base_fee_paid_at?: string | null;
  rights_reverted?: boolean;
  kill_fee_paid_cents?: number;
  posted_url: string | null;
  posted_platform: PlatformId | null;
  posted_at: string | null;
  posted_by?: 'holder' | 'editor';
  tracking_ends_at: string | null;
  last_view_update_at: string | null;
  counted_views: number;
  gross_earnings_cents: number;
  platform_fee_cents: number;
  net_earnings_cents: number;
  created_at: string;
  updated_at: string;
}

export interface ViewSnapshot {
  id: string;
  submission_id: string;
  campaign_id: string;
  views: number;
  source: 'manual' | 'api';
  proof_url: string;
  note: string | null;
  verified: boolean;
  created_by: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  snapshot_id: string;
  submission_id: string;
  campaign_id: string;
  opened_by: string;
  against_user_id: string;
  reason: string;
  claimed_views: number;
  evidence_url: string | null;
  status: DisputeStatus;
  resolution_note: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface PayoutRequest {
  id: string;
  editor_id: string;
  campaign_id: string | null;
  account_holder_id: string | null;
  amount_cents: number;
  currency: CurrencyCode;
  payout_method_type: PayoutMethodType;
  payout_method_summary: string;
  status: PayoutRequestStatus;
  reference_number: string | null;
  receipt_url: string | null;
  paid_by: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface LedgerEntry {
  id: string;
  user_id: string;
  campaign_id: string | null;
  submission_id: string | null;
  payout_request_id: string | null;
  entry_type: LedgerEntryType;
  amount_cents: number;
  currency: CurrencyCode;
  balance_after_cents: number;
  description: string;
  created_by: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  action_url: string;
  email_sent: boolean;
  read: boolean;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  platform_fee_percent: number;
  min_payout_cents: number;
  post_deadline_hours: number;
  view_update_interval_days: number;
  default_tracking_window_days: number;
  updated_at: string;
}

export interface WhapDatabase {
  settings: PlatformSettings;
  profiles: Profile[];
  campaigns: Campaign[];
  submissions: Submission[];
  view_snapshots: ViewSnapshot[];
  disputes: Dispute[];
  payout_requests: PayoutRequest[];
  ledger_entries: LedgerEntry[];
  notifications: AppNotification[];
}
