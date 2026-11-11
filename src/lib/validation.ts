import { z } from 'zod';

export const PlatformEnum = z.enum(['tiktok', 'ig_reels', 'youtube_shorts', 'fb_reels']);
export const CurrencyEnum = z.enum(['USD', 'PHP']);
export const CampaignStatusEnum = z.enum(['draft', 'open', 'closed', 'completed']);
export const SubmissionStatusEnum = z.enum([
  'submitted',
  'revision_requested',
  'resubmitted',
  'selected',
  'posted',
  'paid',
  'rejected',
]);

// 1. Auth & 1-Screen Onboarding Schema (No payout method at signup!)
export const OnboardingSchema = z.object({
  display_name: z.string().trim().min(2, 'Display name must be at least 2 characters').max(50),
  role: z.enum(['editor', 'account_holder', 'both']),
});

export const SwitchRoleSchema = z.object({
  active_role: z.enum(['editor', 'account_holder', 'admin']),
});

export const UpdateProfileSchema = z.object({
  display_name: z.string().trim().min(2).max(50),
  username: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(280).optional().default(''),
  niches: z.array(z.string().trim().min(1)).max(10).default([]),
  portfolio_url: z.string().url('Invalid portfolio URL').or(z.literal('')).optional(),
  sample_clip_urls: z.array(z.string().url()).max(5).default([]),
});

export const InstructionAssetTypeEnum = z.enum(['link', 'image', 'audio', 'file']);

export const InstructionAssetSchema = z.object({
  id: z.string().min(1),
  type: InstructionAssetTypeEnum,
  title: z.string().trim().min(1, 'Asset title is required').max(120),
  url: z.string().min(1, 'Asset URL or upload data is required'),
  file_name: z.string().optional(),
  file_size_bytes: z.number().int().optional(),
  note: z.string().max(500).optional(),
});

// 2. Campaign Schema
export const CampaignSchema = z
  .object({
    title: z.string().trim().min(4, 'Campaign title must be at least 4 characters').max(120),
    brief: z.string().trim().min(15, 'Provide clear editing instructions (at least 15 chars)').max(4000),
    niche: z.string().trim().min(2, 'Select or enter a niche').max(40),
    source_links: z.array(z.string()).default([]),
    instruction_assets: z.array(InstructionAssetSchema).default([]),
    platforms: z.array(PlatformEnum).min(1, 'Select at least 1 target platform'),
    target_page_handles: z
      .array(z.string().trim().min(2, 'Enter a valid page handle e.g. @dailyclips'))
      .min(1, 'Provide at least 1 target page handle'),
    aspect_ratio: z.enum(['9:16', '1:1', '16:9', '4:5']).default('9:16'),
    min_length_sec: z.coerce.number().int().min(5).max(300).default(15),
    max_length_sec: z.coerce.number().int().min(10).max(600).default(60),
    captions_required: z.boolean().default(true),
    hook_notes: z.string().max(500).default(''),
    currency: CurrencyEnum.default('USD'),
    rate_per_1k_cents: z.coerce.number().int().min(1, 'Rate per 1,000 views must be > 0'),
    base_fee_cents: z.coerce.number().int().min(0, 'Base fee cannot be negative').default(0),
    max_payout_per_clip_cents: z.coerce.number().int().min(100, 'Max payout per clip must be at least 1.00'),
    total_budget_cap_cents: z.coerce.number().int().min(500, 'Total budget cap must be at least 5.00'),
    clips_needed: z.coerce.number().int().min(1).max(200).default(5),
    submission_deadline: z.string().min(1, 'Submission deadline is required'),
    view_tracking_window_days: z.coerce.number().int().min(1).max(180).default(30),
    post_deadline_hours: z.coerce.number().int().min(12).max(336).default(72),
    max_submissions_per_editor: z.coerce.number().int().min(1).max(25).default(3),
    status: CampaignStatusEnum.default('open'),
    funded_escrow_cents: z.coerce.number().int().optional(),
    held_escrow_cents: z.coerce.number().int().optional(),
  })
  .refine(
    (data) => (data.source_links && data.source_links.length > 0) || (data.instruction_assets && data.instruction_assets.length > 0),
    {
      message: 'Provide at least 1 instruction asset (link, photo, or audio)',
      path: ['source_links'],
    }
  )
  .refine((data) => data.max_length_sec >= data.min_length_sec, {
    message: 'Max length must be greater than or equal to min length',
    path: ['max_length_sec'],
  })
  .refine((data) => data.total_budget_cap_cents >= data.max_payout_per_clip_cents + data.base_fee_cents, {
    message: 'Total budget cap must cover at least one full max-payout clip',
    path: ['total_budget_cap_cents'],
  });

// 3. Submission Schema (Resumable upload OR external link)
export const CreateSubmissionSchema = z
  .object({
    campaign_id: z.string().min(1),
    source_type: z.enum(['upload', 'link']),
    storage_path: z.string().nullable().optional(),
    external_link: z.string().url('Enter a valid Google Drive or Dropbox URL').nullable().optional().or(z.literal('')),
    file_name: z.string().nullable().optional(),
    file_size_bytes: z
      .number()
      .int()
      .max(500 * 1024 * 1024, 'File size exceeds 500MB limit')
      .nullable()
      .optional(),
    duration_sec: z.coerce.number().int().min(3).max(600).default(34),
    suggested_caption: z.string().max(500).optional().default(''),
    hashtags: z.array(z.string().trim()).max(20).optional().default([]),
    notes: z.string().max(1000).optional().default(''),
  })
  .refine(
    (data) => {
      if (data.source_type === 'upload') {
        return Boolean(data.storage_path && data.storage_path.trim().length > 0);
      }
      return Boolean(data.external_link && data.external_link.trim().length > 0);
    },
    {
      message: 'Provide an uploaded video file (mp4/mov up to 500MB) or a valid Drive/Dropbox link',
      path: ['source_type'],
    }
  );

// 4. Review Queue Action Schema
export const ReviewActionSchema = z
  .object({
    submission_id: z.string().min(1),
    decision: z.enum(['select', 'request_revision', 'reject']),
    note: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.decision === 'request_revision' || data.decision === 'reject') {
        return Boolean(data.note && data.note.length >= 4);
      }
      return true;
    },
    {
      message: 'A clear note/reason (at least 4 characters) is required when requesting a revision or rejecting a clip',
      path: ['note'],
    }
  );

// 5. Post URL + Initial View Snapshot Schema
export const SubmitPostUrlSchema = z.object({
  submission_id: z.string().min(1),
  posted_url: z.string().url('Enter a valid live post URL (TikTok, Reels, or Shorts)'),
  posted_platform: PlatformEnum,
  initial_views: z.coerce.number().int().min(0).default(0),
  proof_url: z.string().min(1, 'Screenshot proof URL is required'),
  submitted_by: z.enum(['holder', 'editor']).default('holder'),
});

// 6. View Snapshot Update Schema
export const ViewSnapshotSchema = z.object({
  submission_id: z.string().min(1),
  views: z.coerce.number().int().min(0, 'View count must be 0 or greater'),
  source: z.enum(['manual', 'api']).default('manual'),
  proof_url: z.string().min(1, 'Screenshot proof is required for view updates'),
  note: z.string().max(300).optional(),
});

// 7. Dispute Schema
export const OpenDisputeSchema = z.object({
  snapshot_id: z.string().min(1),
  submission_id: z.string().min(1),
  reason: z.string().trim().min(10, 'Describe the discrepancy clearly (min 10 characters)').max(1000),
  claimed_views: z.coerce.number().int().min(0, 'Enter the actual view count shown on the live post'),
  evidence_url: z.string().url('Provide a link to your screenshot or screen-recording proof').or(z.literal('')).optional(),
});

export const ResolveDisputeSchema = z.object({
  dispute_id: z.string().min(1),
  decision: z.enum(['resolved_upheld', 'resolved_overturned']),
  corrected_views: z.coerce.number().int().min(0).optional(),
  resolution_note: z.string().trim().min(5, 'Resolution note is required').max(1000),
});

// 8. Payout Method & Request Schema
export const PayoutMethodSchema = z
  .object({
    type: z.enum(['gcash', 'paypal', 'bank', 'stripe']),
    gcash_number: z.string().trim().optional(),
    gcash_name: z.string().trim().optional(),
    paypal_email: z.string().trim().email().optional().or(z.literal('')),
    bank_name: z.string().trim().optional(),
    bank_account_number: z.string().trim().optional(),
    bank_account_name: z.string().trim().optional(),
    stripe_account_id: z.string().trim().optional(),
    stripe_email: z.string().trim().email().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.type === 'gcash') {
        return Boolean(data.gcash_number && data.gcash_number.length >= 10 && data.gcash_name);
      }
      if (data.type === 'paypal') {
        return Boolean(data.paypal_email && data.paypal_email.includes('@'));
      }
      if (data.type === 'bank') {
        return Boolean(data.bank_name && data.bank_account_number && data.bank_account_name);
      }
      if (data.type === 'stripe') {
        return Boolean((data.stripe_email && data.stripe_email.includes('@')) || data.stripe_account_id);
      }
      return false;
    },
    {
      message: 'Complete all required fields for the chosen payout method',
      path: ['type'],
    }
  );

export const StripeDepositSchema = z.object({
  campaign_id: z.string().min(1, 'Campaign ID is required'),
  amount_cents: z.coerce.number().int().min(500, 'Minimum deposit is $5.00 (500 cents)'),
  currency: CurrencyEnum.default('USD'),
  success_url: z.string().optional(),
  cancel_url: z.string().optional(),
});

export const RequestPayoutSchema = z.object({
  amount_cents: z.coerce.number().int().min(100, 'Amount must be positive'),
  currency: CurrencyEnum.default('USD'),
  campaign_id: z.string().nullable().optional(),
});

export const MarkPayoutPaidSchema = z.object({
  payout_request_id: z.string().min(1),
  reference_number: z.string().trim().min(3, 'Payment reference number is required').max(120),
  receipt_url: z.string().optional().default(''),
});

// 9. Admin Settings & User Moderation Schema
export const AdminSettingsSchema = z.object({
  platform_fee_percent: z.coerce.number().min(0).max(50),
  min_payout_cents: z.coerce.number().int().min(100),
  post_deadline_hours: z.coerce.number().int().min(12).max(336),
  view_update_interval_days: z.coerce.number().int().min(1).max(30),
  default_tracking_window_days: z.coerce.number().int().min(7).max(180),
});
