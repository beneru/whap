'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActiveRole,
  AppNotification,
  Campaign,
  CurrencyCode,
  Dispute,
  LedgerEntry,
  PayoutMethodDetails,
  PayoutRequest,
  PlatformId,
  PlatformSettings,
  Profile,
  Submission,
  UserRole,
  ViewSnapshot,
  WhapDatabase,
} from '@/lib/types';
import { createSeedDatabase } from '@/lib/seed-data';
import {
  calculateCampaignBudgetSummary,
  calculateClipEarningsCents,
  formatMoneyCents,
  getLatestVerifiedViewsInWindow,
} from '@/lib/payout-math';
import { buildNotificationRecord, EmailLogEntry } from '@/lib/notifications';
import { getViewTracker } from '@/lib/view-tracker';
import {
  AdminSettingsSchema,
  CampaignSchema,
  CreateSubmissionSchema,
  MarkPayoutPaidSchema,
  OnboardingSchema,
  OpenDisputeSchema,
  PayoutMethodSchema,
  RequestPayoutSchema,
  ResolveDisputeSchema,
  ReviewActionSchema,
  SubmitPostUrlSchema,
  UpdateProfileSchema,
  ViewSnapshotSchema,
} from '@/lib/validation';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

const DB_STORAGE_KEY = 'whap_marketplace_db_v1';
const USER_STORAGE_KEY = 'whap_current_user_id_v1';
const EMAIL_OUTBOX_KEY = 'whap_email_outbox_v1';

interface PendingAuthSession {
  email: string;
  provider: 'google' | 'magic_link';
  redirectAfterOnboarding?: string;
}

interface WhapContextValue {
  db: WhapDatabase;
  currentUser: Profile | null;
  activeRole: ActiveRole;
  pendingOnboarding: PendingAuthSession | null;
  emailOutbox: EmailLogEntry[];
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authRedirectTarget: string | null;
  openAuthModal: (redirectTarget?: string) => void;
  closeAuthModal: () => void;
  // Auth & Onboarding
  signInWithGoogle: (email?: string, redirectTarget?: string) => Promise<{ needsOnboarding: boolean }>;
  signInWithMagicLink: (email: string, redirectTarget?: string) => Promise<{ needsOnboarding: boolean }>;
  completeOnboarding: (input: { display_name: string; role: 'editor' | 'account_holder' | 'both' }) => Profile;
  completePasswordlessOnboarding: (input: {
    email: string;
    display_name: string;
    role: 'editor' | 'account_holder' | 'both';
    auth_provider: 'google' | 'magic_link';
  }) => Profile;
  switchActiveRole: (role: ActiveRole) => void;
  switchDemoUser: (userId: string | null) => void;
  switchDemoPersona: (userId: string | null) => void;
  signOut: () => void;
  updateProfile: (input: {
    display_name: string;
    username: string;
    bio?: string;
    niches: string[];
    portfolio_url?: string;
    sample_clip_urls: string[];
  }) => void;
  updateEditorProfile: (input: {
    display_name: string;
    bio?: string;
    niches: string[];
    portfolio_url?: string;
    sample_clip_urls: string[];
  }) => void;
  // Campaigns
  createCampaign: (input: Record<string, unknown>) => Campaign;
  updateCampaign: (campaignId: string, input: Record<string, unknown>) => Campaign;
  // Submissions & Review Queue
  createSubmission: (input: {
    campaign_id: string;
    source_type: 'upload' | 'link';
    storage_path?: string | null;
    external_link?: string | null;
    preview_video_url?: string | null;
    file_name?: string | null;
    file_size_bytes?: number | null;
    duration_sec?: number;
    suggested_caption?: string;
    hashtags?: string[];
    notes?: string;
    resubmit_submission_id?: string;
  }) => Submission;
  resubmitClip: (input: {
    submission_id: string;
    file_name: string;
    notes: string;
  }) => Submission;
  reviewSubmission: (input: {
    submission_id: string;
    decision?: 'select' | 'request_revision' | 'reject';
    action?: 'select' | 'request_revision' | 'reject';
    note?: string;
  }) => Submission;
  flagOverduePostDeadline: (submissionId: string) => void;
  triggerMissedDeadlineCheck: () => number;
  // Post URL, View Snapshots, Disputes
  submitPostUrl: (input: {
    submission_id: string;
    posted_url: string;
    posted_platform: PlatformId;
    initial_views: number;
    proof_url: string;
    submitted_by?: 'holder' | 'editor';
  }) => Promise<Submission>;
  submitPostUrlForClip: (input: {
    submission_id: string;
    post_url: string;
    initial_views: number;
    proof_url: string;
    submitted_by?: 'holder' | 'editor';
  }) => Promise<Submission>;
  addViewSnapshot: (input: {
    submission_id: string;
    views: number;
    source?: 'manual' | 'api';
    proof_url: string;
    note?: string;
  }) => Promise<ViewSnapshot>;
  recordManualViewSnapshot: (input: {
    submission_id: string;
    views: number;
    proof_url: string;
  }) => Promise<ViewSnapshot>;
  openDispute: (input: {
    snapshot_id: string;
    submission_id: string;
    reason: string;
    claimed_views: number;
    evidence_url?: string;
  }) => Dispute;
  openViewDispute: (input: {
    snapshot_id: string;
    submission_id: string;
    reason: string;
    claimed_views: number;
    evidence_url?: string;
  }) => Dispute;
  resolveDispute: (input: {
    dispute_id: string;
    decision: 'resolved_upheld' | 'resolved_overturned';
    corrected_views?: number;
    resolution_note: string;
  }) => Dispute;
  // Payouts & Ledger
  savePayoutMethod: (input: PayoutMethodDetails) => void;
  getUserAvailableBalanceCents: (userId: string, currency?: CurrencyCode) => number;
  getUserTotalEarnedCents: (userId: string, currency?: CurrencyCode) => number;
  getEditorWalletSummary: (userId: string) => {
    availableBalanceCents: number;
    totalEarnedCents: number;
    totalPaidCents: number;
    pendingPayoutCents: number;
    canRequestPayout: boolean;
    needsPayoutSetup: boolean;
  };
  requestPayout: (input: {
    amount_cents: number;
    currency: CurrencyCode;
    campaign_id?: string | null;
  }) => PayoutRequest;
  markPayoutPaid: (input: {
    payout_request_id?: string;
    payout_id?: string;
    reference_number: string;
    receipt_url?: string;
    receipt_image_url?: string;
  }) => PayoutRequest;
  addAdminLedgerAdjustment: (input: {
    user_id: string;
    amount_cents: number;
    currency: CurrencyCode;
    description: string;
  }) => LedgerEntry;
  // Admin & Settings
  toggleSuspendUser: (userId: string) => void;
  updatePlatformSettings: (input: Omit<PlatformSettings, 'id' | 'updated_at'>) => void;
  // Notifications
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoSeed: () => void;
  resetToInitialSeed: () => void;
}

const WhapContext = createContext<WhapContextValue | null>(null);

export function WhapProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<WhapDatabase>(() => createSeedDatabase());
  const [currentUserId, setCurrentUserId] = useState<string | null>('editor-1');
  const [pendingOnboarding, setPendingOnboarding] = useState<PendingAuthSession | null>(null);
  const [emailOutbox, setEmailOutbox] = useState<EmailLogEntry[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRedirectTarget, setAuthRedirectTarget] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedDb = window.localStorage.getItem(DB_STORAGE_KEY);
      if (savedDb) {
        setDb(JSON.parse(savedDb));
      }
      const savedUser = window.localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser !== null) {
        setCurrentUserId(savedUser === '__LOGGED_OUT__' ? null : savedUser);
      }
      const savedEmails = window.localStorage.getItem(EMAIL_OUTBOX_KEY);
      if (savedEmails) {
        setEmailOutbox(JSON.parse(savedEmails));
      }
    } catch {
      // fallback to seed
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
      window.localStorage.setItem(USER_STORAGE_KEY, currentUserId ?? '__LOGGED_OUT__');
      window.localStorage.setItem(EMAIL_OUTBOX_KEY, JSON.stringify(emailOutbox));
    } catch {
      // ignore quota error
    }
  }, [db, currentUserId, emailOutbox, hydrated]);

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return db.profiles.find((p) => p.id === currentUserId) || null;
  }, [db.profiles, currentUserId]);

  const pushNotification = (
    draftNotifications: AppNotification[],
    draftProfiles: Profile[],
    input: {
      userId: string;
      type: AppNotification['type'];
      title: string;
      body: string;
      actionUrl: string;
    }
  ) => {
    const recipient = draftProfiles.find((p) => p.id === input.userId);
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { notification, emailPayload } = buildNotificationRecord(id, {
      ...input,
      recipientEmail: recipient?.email,
    });
    draftNotifications.unshift(notification);
    setEmailOutbox((prev) => [emailPayload, ...prev.slice(0, 49)]);
  };

  const openAuthModal = (redirectTarget?: string) => {
    if (redirectTarget) setAuthRedirectTarget(redirectTarget);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const signInWithGoogle = async (
    emailInput?: string,
    redirectTarget?: string
  ): Promise<{ needsOnboarding: boolean }> => {
    const sb = getSupabaseBrowserClient();
    if (isSupabaseConfigured() && sb && !emailInput) {
      await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTarget || '/onboarding'}`,
        },
      });
    }

    const email = (emailInput || 'new.clipper@gmail.com').trim().toLowerCase();
    const existing = db.profiles.find((p) => p.email.toLowerCase() === email);
    if (existing) {
      if (existing.suspended) {
        throw new Error('This account has been suspended by an administrator.');
      }
      setCurrentUserId(existing.id);
      setPendingOnboarding(null);
      setAuthModalOpen(false);
      return { needsOnboarding: !existing.onboarded };
    }

    setPendingOnboarding({
      email,
      provider: 'google',
      redirectAfterOnboarding: redirectTarget || authRedirectTarget || undefined,
    });
    setAuthModalOpen(false);
    return { needsOnboarding: true };
  };

  const signInWithMagicLink = async (
    emailInput: string,
    redirectTarget?: string
  ): Promise<{ needsOnboarding: boolean }> => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new Error('Enter a valid email address to receive your instant magic link.');
    }

    const sb = getSupabaseBrowserClient();
    if (isSupabaseConfigured() && sb) {
      await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTarget || '/onboarding'}`,
        },
      });
    }

    const existing = db.profiles.find((p) => p.email.toLowerCase() === email);
    if (existing) {
      if (existing.suspended) {
        throw new Error('This account has been suspended by an administrator.');
      }
      setCurrentUserId(existing.id);
      setPendingOnboarding(null);
      setAuthModalOpen(false);
      return { needsOnboarding: !existing.onboarded };
    }

    setPendingOnboarding({
      email,
      provider: 'magic_link',
      redirectAfterOnboarding: redirectTarget || authRedirectTarget || undefined,
    });
    setAuthModalOpen(false);
    return { needsOnboarding: true };
  };

  const completeOnboarding = (input: {
    display_name: string;
    role: 'editor' | 'account_holder' | 'both';
  }): Profile => {
    const parsed = OnboardingSchema.parse(input);
    const email = pendingOnboarding?.email || `editor.${Date.now()}@whap.app`;
    const baseHandle = parsed.display_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 18) || 'clipper';
    const uniqueUsername = db.profiles.some((p) => p.username === baseHandle)
      ? `${baseHandle}${Math.floor(10 + Math.random() * 89)}`
      : baseHandle;

    const activeRole: ActiveRole =
      parsed.role === 'account_holder' ? 'account_holder' : 'editor';

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      email,
      username: uniqueUsername,
      display_name: parsed.display_name,
      role: parsed.role,
      active_role: activeRole,
      bio: '',
      niches: [],
      portfolio_url: '',
      sample_clip_urls: [],
      // Payout method is strictly NULL at signup; collected only when first earning appears
      payout_method_type: null,
      payout_method_details: null,
      suspended: false,
      onboarded: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDb((prev) => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
    }));
    setCurrentUserId(newProfile.id);
    setPendingOnboarding(null);
    return newProfile;
  };

  const switchActiveRole = (newRole: ActiveRole) => {
    if (!currentUser) return;
    setDb((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => {
        if (p.id !== currentUser.id) return p;
        const upgradedRole: UserRole =
          p.role === 'admin'
            ? 'admin'
            : p.role !== newRole && p.role !== 'both'
            ? 'both'
            : p.role;
        return {
          ...p,
          role: upgradedRole,
          active_role: newRole,
          updated_at: new Date().toISOString(),
        };
      }),
    }));
  };

  const switchDemoUser = (userId: string | null) => {
    setPendingOnboarding(null);
    setCurrentUserId(userId);
  };

  const signOut = () => {
    setCurrentUserId(null);
    setPendingOnboarding(null);
  };

  const updateProfile = (input: {
    display_name: string;
    username: string;
    bio?: string;
    niches: string[];
    portfolio_url?: string;
    sample_clip_urls: string[];
  }) => {
    if (!currentUser) throw new Error('Must be signed in to update profile.');
    const parsed = UpdateProfileSchema.parse(input);
    const conflict = db.profiles.find(
      (p) => p.id !== currentUser.id && p.username.toLowerCase() === parsed.username.toLowerCase()
    );
    if (conflict) {
      throw new Error('That username is already taken.');
    }

    setDb((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) =>
        p.id === currentUser.id
          ? {
              ...p,
              display_name: parsed.display_name,
              username: parsed.username,
              bio: parsed.bio || '',
              niches: parsed.niches,
              portfolio_url: parsed.portfolio_url || '',
              sample_clip_urls: parsed.sample_clip_urls,
              updated_at: new Date().toISOString(),
            }
          : p
      ),
    }));
  };

  const createCampaign = (input: Record<string, unknown>): Campaign => {
    if (!currentUser) throw new Error('Sign in as an Account Holder to create a campaign.');
    const parsed = CampaignSchema.parse(input);
    const nowIso = new Date().toISOString();

    const campaign: Campaign = {
      id: `camp-${Date.now()}`,
      owner_id: currentUser.id,
      ...parsed,
      funded_escrow_cents: parsed.funded_escrow_cents ?? parsed.total_budget_cap_cents,
      held_escrow_cents: 0,
      created_at: nowIso,
      updated_at: nowIso,
    };

    setDb((prev) => ({
      ...prev,
      campaigns: [campaign, ...prev.campaigns],
    }));

    return campaign;
  };

  const updateCampaign = (campaignId: string, input: Record<string, unknown>): Campaign => {
    if (!currentUser) throw new Error('Sign in to update this campaign.');
    const existing = db.campaigns.find((c) => c.id === campaignId);
    if (!existing) throw new Error('Campaign not found.');
    if (existing.owner_id !== currentUser.id && currentUser.role !== 'admin') {
      throw new Error('Only the campaign Account Holder or an Admin can edit this campaign.');
    }

    const parsed = CampaignSchema.parse({ ...existing, ...input });
    const updated: Campaign = {
      ...existing,
      ...parsed,
      funded_escrow_cents: parsed.funded_escrow_cents ?? existing.funded_escrow_cents ?? parsed.total_budget_cap_cents,
      held_escrow_cents: existing.held_escrow_cents ?? 0,
      updated_at: new Date().toISOString(),
    };

    setDb((prev) => ({
      ...prev,
      campaigns: prev.campaigns.map((c) => (c.id === campaignId ? updated : c)),
    }));

    return updated;
  };

  const createSubmission = (input: {
    campaign_id: string;
    source_type: 'upload' | 'link';
    storage_path?: string | null;
    external_link?: string | null;
    preview_video_url?: string | null;
    file_name?: string | null;
    file_size_bytes?: number | null;
    duration_sec?: number;
    suggested_caption?: string;
    hashtags?: string[];
    notes?: string;
    resubmit_submission_id?: string;
  }): Submission => {
    if (!currentUser) throw new Error('Sign in as an Editor to submit a clip.');
    if (currentUser.suspended) throw new Error('Suspended accounts cannot submit clips.');

    const campaign = db.campaigns.find((c) => c.id === input.campaign_id);
    if (!campaign) throw new Error('Campaign not found.');
    if (campaign.status !== 'open') {
      throw new Error(`This campaign is currently ${campaign.status} and not accepting new submissions.`);
    }

    const parsed = CreateSubmissionSchema.parse(input);
    const nowIso = new Date().toISOString();

    // Resubmission flow for revision_requested clip
    if (input.resubmit_submission_id) {
      const existingSub = db.submissions.find((s) => s.id === input.resubmit_submission_id);
      if (!existingSub) throw new Error('Original submission not found.');
      const updatedSub: Submission = {
        ...existingSub,
        source_type: parsed.source_type,
        storage_path: parsed.storage_path || existingSub.storage_path,
        external_link: parsed.external_link || existingSub.external_link,
        preview_video_url: input.preview_video_url || existingSub.preview_video_url,
        file_name: parsed.file_name || existingSub.file_name,
        file_size_bytes: parsed.file_size_bytes ?? existingSub.file_size_bytes,
        duration_sec: parsed.duration_sec,
        suggested_caption: parsed.suggested_caption,
        hashtags: parsed.hashtags,
        notes: parsed.notes,
        status: 'resubmitted',
        updated_at: nowIso,
      };

      setDb((prev) => {
        const nextNotifications = [...prev.notifications];
        pushNotification(nextNotifications, prev.profiles, {
          userId: campaign.owner_id,
          type: 'new_submission',
          title: `Resubmitted clip from @${currentUser.username}`,
          body: `${currentUser.display_name} uploaded a revised version for "${campaign.title}".`,
          actionUrl: '/holder/review',
        });
        return {
          ...prev,
          submissions: prev.submissions.map((s) => (s.id === existingSub.id ? updatedSub : s)),
          notifications: nextNotifications,
        };
      });

      return updatedSub;
    }

    // Check max_submissions_per_editor limit
    const editorActiveSubs = db.submissions.filter(
      (s) =>
        s.campaign_id === campaign.id &&
        s.editor_id === currentUser.id &&
        s.status !== 'rejected'
    );
    if (editorActiveSubs.length >= campaign.max_submissions_per_editor) {
      throw new Error(
        `You have reached the maximum of ${campaign.max_submissions_per_editor} active submissions for this campaign.`
      );
    }

    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      campaign_id: campaign.id,
      editor_id: currentUser.id,
      source_type: parsed.source_type,
      storage_path: parsed.storage_path || null,
      external_link: parsed.external_link || null,
      preview_video_url: input.preview_video_url || undefined,
      file_name:
        parsed.file_name ||
        (parsed.source_type === 'link' ? 'external-drive-clip.mp4' : 'uploaded-clip.mp4'),
      file_size_bytes: parsed.file_size_bytes ?? 34500000,
      duration_sec: parsed.duration_sec,
      suggested_caption: parsed.suggested_caption,
      hashtags: parsed.hashtags,
      notes: parsed.notes,
      status: 'submitted',
      revision_note: null,
      rejection_reason: null,
      selected_at: null,
      post_deadline_at: null,
      missed_post_deadline: false,
      clean_file_unlocked: false,
      locked_rate_per_1k_cents: null,
      locked_base_fee_cents: null,
      locked_max_payout_cents: null,
      posted_url: null,
      posted_platform: null,
      posted_at: null,
      tracking_ends_at: null,
      last_view_update_at: null,
      counted_views: 0,
      gross_earnings_cents: 0,
      platform_fee_cents: 0,
      net_earnings_cents: 0,
      created_at: nowIso,
      updated_at: nowIso,
    };

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      pushNotification(nextNotifications, prev.profiles, {
        userId: campaign.owner_id,
        type: 'new_submission',
        title: `New clip submitted by @${currentUser.username}`,
        body: `${currentUser.display_name} submitted ${newSub.file_name} to "${campaign.title}".`,
        actionUrl: '/holder/review',
      });
      return {
        ...prev,
        submissions: [newSub, ...prev.submissions],
        notifications: nextNotifications,
      };
    });

    return newSub;
  };

  const getUserAvailableBalanceCents = (
    userId: string,
    currency: CurrencyCode = 'USD'
  ): number => {
    const ledgerTotal = db.ledger_entries
      .filter((l) => l.user_id === userId && l.currency === currency)
      .reduce((sum, l) => sum + l.amount_cents, 0);

    const pendingPayoutsTotal = db.payout_requests
      .filter(
        (p) =>
          p.editor_id === userId &&
          p.currency === currency &&
          p.status === 'pending'
      )
      .reduce((sum, p) => sum + p.amount_cents, 0);

    return Math.max(0, ledgerTotal - pendingPayoutsTotal);
  };

  const getUserTotalEarnedCents = (
    userId: string,
    currency?: CurrencyCode
  ): number => {
    return db.ledger_entries
      .filter(
        (l) =>
          l.user_id === userId &&
          (l.entry_type === 'earning' || (l.entry_type === 'adjustment' && l.amount_cents > 0)) &&
          (!currency || l.currency === currency)
      )
      .reduce((sum, l) => sum + l.amount_cents, 0);
  };

  const reviewSubmission = (input: {
    submission_id: string;
    decision?: 'select' | 'request_revision' | 'reject';
    action?: 'select' | 'request_revision' | 'reject';
    note?: string;
  }): Submission => {
    const resolvedDecision = input.decision || input.action || 'select';
    const parsed = ReviewActionSchema.parse({
      submission_id: input.submission_id,
      decision: resolvedDecision,
      note: input.note,
    });
    const sub = db.submissions.find((s) => s.id === parsed.submission_id);
    if (!sub) throw new Error('Submission not found.');
    const campaign = db.campaigns.find((c) => c.id === sub.campaign_id);
    if (!campaign) throw new Error('Campaign not found.');

    const now = new Date();
    const nowIso = now.toISOString();
    let updatedSub: Submission = { ...sub, updated_at: nowIso };

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      const nextLedger = [...prev.ledger_entries];

      if (parsed.decision === 'select') {
        const budgetSummary = calculateCampaignBudgetSummary(campaign, prev.submissions, sub.id);
        if (budgetSummary.isExhausted) {
          throw new Error('Cannot select clip: Campaign total budget cap has been reached.');
        }

        const clipEscrowHoldCents = campaign.max_payout_per_clip_cents;
        const availableEscrow = budgetSummary.availableEscrowCents ?? budgetSummary.remainingBudgetCents;
        if (availableEscrow < clipEscrowHoldCents) {
          throw new Error('Cannot select clip: Insufficient campaign escrow funds available to reserve max payout.');
        }

        const deadlineHours = campaign.post_deadline_hours || prev.settings.post_deadline_hours || 72;
        const postDeadlineIso = new Date(now.getTime() + deadlineHours * 3600 * 1000).toISOString();

        const initialEarnings = calculateClipEarningsCents({
          countedViews: 0,
          ratePer1kCents: campaign.rate_per_1k_cents,
          baseFeeCents: campaign.base_fee_cents,
          maxPayoutPerClipCents: campaign.max_payout_per_clip_cents,
          remainingCampaignBudgetCents: budgetSummary.remainingBudgetCents,
          platformFeePercent: prev.settings.platform_fee_percent,
        });

        updatedSub = {
          ...sub,
          status: 'selected',
          selected_at: nowIso,
          post_deadline_at: postDeadlineIso,
          clean_file_unlocked: true,
          locked_rate_per_1k_cents: campaign.rate_per_1k_cents,
          locked_base_fee_cents: campaign.base_fee_cents,
          locked_max_payout_cents: campaign.max_payout_per_clip_cents,
          held_escrow_cents: clipEscrowHoldCents,
          base_fee_paid: initialEarnings.netEarningsCents > 0,
          base_fee_paid_at: initialEarnings.netEarningsCents > 0 ? nowIso : null,
          gross_earnings_cents: initialEarnings.grossEarningsCents,
          platform_fee_cents: initialEarnings.platformFeeCents,
          net_earnings_cents: initialEarnings.netEarningsCents,
          updated_at: nowIso,
        };

        if (initialEarnings.netEarningsCents > 0) {
          const prevBal = nextLedger
            .filter((l) => l.user_id === sub.editor_id && l.currency === campaign.currency)
            .reduce((s, l) => s + l.amount_cents, 0);

          nextLedger.unshift({
            id: `led-${Date.now()}`,
            user_id: sub.editor_id,
            campaign_id: campaign.id,
            submission_id: sub.id,
            payout_request_id: null,
            entry_type: 'earning',
            amount_cents: initialEarnings.netEarningsCents,
            currency: campaign.currency,
            balance_after_cents: prevBal + initialEarnings.netEarningsCents,
            description: `Guaranteed base fee paid instantly upon selection (${sub.file_name}): ${formatMoneyCents(
              initialEarnings.netEarningsCents,
              campaign.currency
            )}`,
            created_by: currentUser?.id || campaign.owner_id,
            created_at: nowIso,
          });

          pushNotification(nextNotifications, prev.profiles, {
            userId: sub.editor_id,
            type: 'base_fee_paid',
            title: `Guaranteed Base Fee Paid: ${formatMoneyCents(initialEarnings.netEarningsCents, campaign.currency)}!`,
            body: `Your clip was selected for "${campaign.title}". The base fee has been automatically credited to your withdrawable wallet.`,
            actionUrl: '/editor/payouts',
          });
        }

        pushNotification(nextNotifications, prev.profiles, {
          userId: sub.editor_id,
          type: 'clip_selected',
          title: `Your clip got picked for "${campaign.title}"!`,
          body: `Clean file is ready and rate locked at ${formatMoneyCents(
            campaign.rate_per_1k_cents,
            campaign.currency
          )}/1k views${
            campaign.base_fee_cents > 0
              ? ` + ${formatMoneyCents(campaign.base_fee_cents, campaign.currency)} base fee`
              : ''
          }. Account Holder has ${deadlineHours}h to submit the live post URL.`,
          actionUrl: '/editor/submissions',
        });
      } else if (parsed.decision === 'request_revision') {
        updatedSub = {
          ...sub,
          status: 'revision_requested',
          revision_note: parsed.note || 'Please revise and resubmit.',
          updated_at: nowIso,
        };
        pushNotification(nextNotifications, prev.profiles, {
          userId: sub.editor_id,
          type: 'revision_requested',
          title: `Revision requested on ${sub.file_name}`,
          body: `Note from Account Holder: "${updatedSub.revision_note}"`,
          actionUrl: '/editor/submissions',
        });
      } else if (parsed.decision === 'reject') {
        updatedSub = {
          ...sub,
          status: 'rejected',
          rejection_reason: parsed.note || 'Did not match campaign format requirements.',
          updated_at: nowIso,
        };
        pushNotification(nextNotifications, prev.profiles, {
          userId: sub.editor_id,
          type: 'clip_rejected',
          title: `Update on submission ${sub.file_name}`,
          body: `Not selected. Reason: "${updatedSub.rejection_reason}"`,
          actionUrl: '/editor/submissions',
        });
      }

      return {
        ...prev,
        submissions: prev.submissions.map((s) => (s.id === sub.id ? updatedSub : s)),
        ledger_entries: nextLedger,
        notifications: nextNotifications,
      };
    });

    return updatedSub;
  };

  const flagOverduePostDeadline = (submissionId: string) => {
    const sub = db.submissions.find((s) => s.id === submissionId);
    if (!sub) return;
    const campaign = db.campaigns.find((c) => c.id === sub.campaign_id);
    if (!campaign) return;
    const holder = db.profiles.find((p) => p.id === campaign.owner_id);
    const nowIso = new Date().toISOString();

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      const nextLedger = [...prev.ledger_entries];

      // If base fee was 0, award a $5.00 (or 500 cents) kill fee to compensate editor
      let killFeeCents = 0;
      if (!sub.base_fee_paid && sub.net_earnings_cents === 0) {
        killFeeCents = Math.min(500, campaign.max_payout_per_clip_cents || 500);
        const prevBal = nextLedger
          .filter((l) => l.user_id === sub.editor_id && l.currency === campaign.currency)
          .reduce((s, l) => s + l.amount_cents, 0);

        nextLedger.unshift({
          id: `led-${Date.now()}`,
          user_id: sub.editor_id,
          campaign_id: campaign.id,
          submission_id: sub.id,
          payout_request_id: null,
          entry_type: 'adjustment',
          amount_cents: killFeeCents,
          currency: campaign.currency,
          balance_after_cents: prevBal + killFeeCents,
          description: `Kill fee awarded: Page owner missed 72h posting deadline (${sub.file_name})`,
          created_by: 'system',
          created_at: nowIso,
        });

        pushNotification(nextNotifications, prev.profiles, {
          userId: sub.editor_id,
          type: 'kill_fee_paid',
          title: `Kill Fee Secured: ${formatMoneyCents(killFeeCents, campaign.currency)}`,
          body: `Because @${holder?.username || 'holder'} missed the posting deadline, a kill fee was credited to your wallet.`,
          actionUrl: '/editor/payouts',
        });
      }

      pushNotification(nextNotifications, prev.profiles, {
        userId: sub.editor_id,
        type: 'rights_reverted',
        title: `Full Clip Rights Reverted (${sub.file_name})`,
        body: `The 72h posting deadline was missed. All copyright and distribution rights have reverted back to you.`,
        actionUrl: '/editor/submissions',
      });

      const admins = prev.profiles.filter((p) => p.role === 'admin');
      for (const adm of admins) {
        pushNotification(nextNotifications, prev.profiles, {
          userId: adm.id,
          type: 'missed_posting_deadline',
          title: `Account Holder @${holder?.username || 'holder'} missed 72h post deadline`,
          body: `Selected clip ${sub.file_name} (ID: ${sub.id}) has no post URL by deadline. Rights reverted to editor.`,
          actionUrl: '/admin',
        });
      }

      return {
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                missed_post_deadline: true,
                rights_reverted: true,
                kill_fee_paid_cents: killFeeCents > 0 ? killFeeCents : undefined,
                held_escrow_cents: 0,
                updated_at: nowIso,
              }
            : s
        ),
        ledger_entries: nextLedger,
        notifications: nextNotifications,
      };
    });
  };

  const submitPostUrl = async (input: {
    submission_id: string;
    posted_url: string;
    posted_platform: PlatformId;
    initial_views: number;
    proof_url: string;
    submitted_by?: 'holder' | 'editor';
  }): Promise<Submission> => {
    const parsed = SubmitPostUrlSchema.parse(input);
    const sub = db.submissions.find((s) => s.id === parsed.submission_id);
    if (!sub) throw new Error('Submission not found.');
    const campaign = db.campaigns.find((c) => c.id === sub.campaign_id);
    if (!campaign) throw new Error('Campaign not found.');

    const actorRole: 'holder' | 'editor' =
      parsed.submitted_by || (currentUser?.id === sub.editor_id ? 'editor' : 'holder');

    const tracker = getViewTracker('manual', parsed.posted_platform);
    const trackResult = await tracker.recordSnapshot({
      submissionId: sub.id,
      campaignId: campaign.id,
      postUrl: parsed.posted_url,
      platform: parsed.posted_platform,
      reportedViews: parsed.initial_views,
      proofUrl: parsed.proof_url,
      note: actorRole === 'editor' ? 'Editor reported live post URL' : 'Initial post URL submission snapshot',
      actorUserId: currentUser?.id || campaign.owner_id,
    });

    const now = new Date();
    const nowIso = now.toISOString();
    const trackingDays = campaign.view_tracking_window_days || 30;
    const trackingEndsIso = new Date(now.getTime() + trackingDays * 86400 * 1000).toISOString();

    const budgetSummary = calculateCampaignBudgetSummary(campaign, db.submissions, sub.id);
    const earnings = calculateClipEarningsCents({
      countedViews: trackResult.views,
      ratePer1kCents: sub.locked_rate_per_1k_cents ?? campaign.rate_per_1k_cents,
      baseFeeCents: sub.locked_base_fee_cents ?? campaign.base_fee_cents,
      maxPayoutPerClipCents: sub.locked_max_payout_cents ?? campaign.max_payout_per_clip_cents,
      remainingCampaignBudgetCents: budgetSummary.remainingBudgetCents,
      platformFeePercent: db.settings.platform_fee_percent,
    });

    const deltaNetCents = Math.max(0, earnings.netEarningsCents - sub.net_earnings_cents);

    const updatedSub: Submission = {
      ...sub,
      status: 'posted',
      posted_url: parsed.posted_url,
      posted_platform: parsed.posted_platform,
      posted_by: actorRole,
      posted_at: nowIso,
      tracking_ends_at: trackingEndsIso,
      last_view_update_at: nowIso,
      counted_views: trackResult.views,
      gross_earnings_cents: earnings.grossEarningsCents,
      platform_fee_cents: earnings.platformFeeCents,
      net_earnings_cents: earnings.netEarningsCents,
      updated_at: nowIso,
    };

    const newSnapshot: ViewSnapshot = {
      id: `snap-${Date.now()}`,
      submission_id: sub.id,
      campaign_id: campaign.id,
      views: trackResult.views,
      source: 'manual',
      proof_url: trackResult.proofUrl,
      note: actorRole === 'editor' ? 'Editor reported live post URL' : 'Initial post URL submission',
      verified: true,
      created_by: currentUser?.id || campaign.owner_id,
      created_at: nowIso,
    };

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      const nextLedger = [...prev.ledger_entries];

      if (deltaNetCents > 0) {
        const prevBal = nextLedger
          .filter((l) => l.user_id === sub.editor_id && l.currency === campaign.currency)
          .reduce((s, l) => s + l.amount_cents, 0);

        nextLedger.unshift({
          id: `led-${Date.now()}`,
          user_id: sub.editor_id,
          campaign_id: campaign.id,
          submission_id: sub.id,
          payout_request_id: null,
          entry_type: 'earning',
          amount_cents: deltaNetCents,
          currency: campaign.currency,
          balance_after_cents: prevBal + deltaNetCents,
          description: `Post live + initial ${trackResult.views.toLocaleString()} views (${sub.file_name})`,
          created_by: currentUser?.id || campaign.owner_id,
          created_at: nowIso,
        });
      }

      if (actorRole === 'editor') {
        pushNotification(nextNotifications, prev.profiles, {
          userId: campaign.owner_id,
          type: 'post_url_added',
          title: `Live Post URL Added for "${sub.file_name}"`,
          body: `Editor @${currentUser?.username || 'editor'} reported that this clip is live on your ${parsed.posted_platform} page. View tracking and escrow accrual have begun.`,
          actionUrl: '/holder',
        });
        pushNotification(nextNotifications, prev.profiles, {
          userId: sub.editor_id,
          type: 'post_url_added',
          title: `Live Post URL Verified for "${sub.file_name}"`,
          body: `Your submitted live post URL has been recorded and view tracking is active.`,
          actionUrl: '/editor/submissions',
        });
      } else {
        pushNotification(nextNotifications, prev.profiles, {
          userId: sub.editor_id,
          type: 'post_url_added',
          title: `Your clip is LIVE on ${parsed.posted_platform.toUpperCase()}!`,
          body: `Post URL submitted: ${parsed.posted_url}. ${trackingDays}-day view tracking is now active.`,
          actionUrl: '/editor/submissions',
        });
      }

      return {
        ...prev,
        submissions: prev.submissions.map((s) => (s.id === sub.id ? updatedSub : s)),
        view_snapshots: [newSnapshot, ...prev.view_snapshots],
        ledger_entries: nextLedger,
        notifications: nextNotifications,
      };
    });

    return updatedSub;
  };

  const addViewSnapshot = async (input: {
    submission_id: string;
    views: number;
    source?: 'manual' | 'api';
    proof_url: string;
    note?: string;
  }): Promise<ViewSnapshot> => {
    const parsed = ViewSnapshotSchema.parse(input);
    const sub = db.submissions.find((s) => s.id === parsed.submission_id);
    if (!sub) throw new Error('Submission not found.');
    const campaign = db.campaigns.find((c) => c.id === sub.campaign_id);
    if (!campaign) throw new Error('Campaign not found.');

    const tracker = getViewTracker(parsed.source, sub.posted_platform || 'tiktok');
    const trackResult = await tracker.recordSnapshot({
      submissionId: sub.id,
      campaignId: campaign.id,
      postUrl: sub.posted_url || 'https://tiktok.com',
      platform: sub.posted_platform || 'tiktok',
      reportedViews: parsed.views,
      proofUrl: parsed.proof_url,
      note: parsed.note,
      actorUserId: currentUser?.id || campaign.owner_id,
    });

    const nowIso = new Date().toISOString();
    const newSnapshot: ViewSnapshot = {
      id: `snap-${Date.now()}`,
      submission_id: sub.id,
      campaign_id: campaign.id,
      views: trackResult.views,
      source: trackResult.source,
      proof_url: trackResult.proofUrl,
      note: parsed.note || 'Weekly verified view update',
      verified: true,
      created_by: currentUser?.id || campaign.owner_id,
      created_at: nowIso,
    };

    const allSubSnapshots = [
      newSnapshot,
      ...db.view_snapshots.filter((s) => s.submission_id === sub.id),
    ];
    const countedViews = getLatestVerifiedViewsInWindow(allSubSnapshots, sub.tracking_ends_at);
    const budgetSummary = calculateCampaignBudgetSummary(campaign, db.submissions, sub.id);

    const earnings = calculateClipEarningsCents({
      countedViews,
      ratePer1kCents: sub.locked_rate_per_1k_cents ?? campaign.rate_per_1k_cents,
      baseFeeCents: sub.locked_base_fee_cents ?? campaign.base_fee_cents,
      maxPayoutPerClipCents: sub.locked_max_payout_cents ?? campaign.max_payout_per_clip_cents,
      remainingCampaignBudgetCents: budgetSummary.remainingBudgetCents,
      platformFeePercent: db.settings.platform_fee_percent,
    });

    const deltaNetCents = earnings.netEarningsCents - sub.net_earnings_cents;

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      const nextLedger = [...prev.ledger_entries];

      if (deltaNetCents !== 0) {
        const prevBal = nextLedger
          .filter((l) => l.user_id === sub.editor_id && l.currency === campaign.currency)
          .reduce((s, l) => s + l.amount_cents, 0);

        nextLedger.unshift({
          id: `led-${Date.now()}`,
          user_id: sub.editor_id,
          campaign_id: campaign.id,
          submission_id: sub.id,
          payout_request_id: null,
          entry_type: 'earning',
          amount_cents: deltaNetCents,
          currency: campaign.currency,
          balance_after_cents: prevBal + deltaNetCents,
          description: `View update on ${sub.file_name}: ${countedViews.toLocaleString()} views (Total clip payout: ${formatMoneyCents(
            earnings.netEarningsCents,
            campaign.currency
          )})`,
          created_by: currentUser?.id || campaign.owner_id,
          created_at: nowIso,
        });
      }

      pushNotification(nextNotifications, prev.profiles, {
        userId: sub.editor_id,
        type: 'view_update',
        title: `View snapshot updated: ${countedViews.toLocaleString()} views`,
        body: `Your clip ${sub.file_name} is now at ${countedViews.toLocaleString()} verified views (${formatMoneyCents(
          earnings.netEarningsCents,
          campaign.currency
        )} accrued).`,
        actionUrl: '/editor/submissions',
      });

      return {
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                counted_views: countedViews,
                last_view_update_at: nowIso,
                gross_earnings_cents: earnings.grossEarningsCents,
                platform_fee_cents: earnings.platformFeeCents,
                net_earnings_cents: earnings.netEarningsCents,
                updated_at: nowIso,
              }
            : s
        ),
        view_snapshots: [newSnapshot, ...prev.view_snapshots],
        ledger_entries: nextLedger,
        notifications: nextNotifications,
      };
    });

    return newSnapshot;
  };

  const openDispute = (input: {
    snapshot_id: string;
    submission_id: string;
    reason: string;
    claimed_views: number;
    evidence_url?: string;
  }): Dispute => {
    if (!currentUser) throw new Error('Sign in to open a dispute.');
    const parsed = OpenDisputeSchema.parse(input);
    const sub = db.submissions.find((s) => s.id === parsed.submission_id);
    if (!sub) throw new Error('Submission not found.');
    const campaign = db.campaigns.find((c) => c.id === sub.campaign_id);
    if (!campaign) throw new Error('Campaign not found.');

    const nowIso = new Date().toISOString();
    const dispute: Dispute = {
      id: `disp-${Date.now()}`,
      snapshot_id: parsed.snapshot_id,
      submission_id: sub.id,
      campaign_id: campaign.id,
      opened_by: currentUser.id,
      against_user_id: campaign.owner_id,
      reason: parsed.reason,
      claimed_views: parsed.claimed_views,
      evidence_url: parsed.evidence_url || null,
      status: 'open',
      resolution_note: null,
      resolved_by: null,
      created_at: nowIso,
      resolved_at: null,
    };

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      pushNotification(nextNotifications, prev.profiles, {
        userId: campaign.owner_id,
        type: 'dispute_opened',
        title: `View dispute opened on ${sub.file_name}`,
        body: `@${currentUser.username} disputed snapshot ${parsed.snapshot_id}, claiming ${parsed.claimed_views.toLocaleString()} views.`,
        actionUrl: '/holder/posted',
      });

      const admins = prev.profiles.filter((p) => p.role === 'admin');
      for (const adm of admins) {
        pushNotification(nextNotifications, prev.profiles, {
          userId: adm.id,
          type: 'dispute_opened',
          title: `New Dispute from @${currentUser.username}`,
          body: `Claimed ${parsed.claimed_views.toLocaleString()} views on ${sub.file_name}. Reason: ${parsed.reason}`,
          actionUrl: '/admin',
        });
      }

      return {
        ...prev,
        disputes: [dispute, ...prev.disputes],
        notifications: nextNotifications,
      };
    });

    return dispute;
  };

  const resolveDispute = (input: {
    dispute_id: string;
    decision: 'resolved_upheld' | 'resolved_overturned';
    corrected_views?: number;
    resolution_note: string;
  }): Dispute => {
    const parsed = ResolveDisputeSchema.parse(input);
    const dispute = db.disputes.find((d) => d.id === parsed.dispute_id);
    if (!dispute) throw new Error('Dispute not found.');
    const sub = db.submissions.find((s) => s.id === dispute.submission_id);
    if (!sub) throw new Error('Submission not found.');
    const campaign = db.campaigns.find((c) => c.id === sub.campaign_id);
    if (!campaign) throw new Error('Campaign not found.');

    const nowIso = new Date().toISOString();
    const resolvedDispute: Dispute = {
      ...dispute,
      status: parsed.decision,
      resolution_note: parsed.resolution_note,
      resolved_by: currentUser?.id || 'admin-1',
      resolved_at: nowIso,
    };

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      const nextLedger = [...prev.ledger_entries];
      let nextSnapshots = [...prev.view_snapshots];
      let nextSubmissions = [...prev.submissions];

      if (parsed.decision === 'resolved_overturned') {
        const finalViews = parsed.corrected_views ?? dispute.claimed_views;
        nextSnapshots = nextSnapshots.map((sn) =>
          sn.id === dispute.snapshot_id
            ? { ...sn, views: finalViews, note: `Admin dispute adjustment: ${parsed.resolution_note}` }
            : sn
        );

        const budgetSummary = calculateCampaignBudgetSummary(campaign, prev.submissions, sub.id);
        const earnings = calculateClipEarningsCents({
          countedViews: finalViews,
          ratePer1kCents: sub.locked_rate_per_1k_cents ?? campaign.rate_per_1k_cents,
          baseFeeCents: sub.locked_base_fee_cents ?? campaign.base_fee_cents,
          maxPayoutPerClipCents: sub.locked_max_payout_cents ?? campaign.max_payout_per_clip_cents,
          remainingCampaignBudgetCents: budgetSummary.remainingBudgetCents,
          platformFeePercent: prev.settings.platform_fee_percent,
        });

        const deltaCents = earnings.netEarningsCents - sub.net_earnings_cents;
        if (deltaCents !== 0) {
          const prevBal = nextLedger
            .filter((l) => l.user_id === sub.editor_id && l.currency === campaign.currency)
            .reduce((s, l) => s + l.amount_cents, 0);

          nextLedger.unshift({
            id: `led-${Date.now()}`,
            user_id: sub.editor_id,
            campaign_id: campaign.id,
            submission_id: sub.id,
            payout_request_id: null,
            entry_type: 'adjustment',
            amount_cents: deltaCents,
            currency: campaign.currency,
            balance_after_cents: prevBal + deltaCents,
            description: `Dispute overturned (${dispute.id}): Verified views adjusted to ${finalViews.toLocaleString()}`,
            created_by: currentUser?.id || 'admin-1',
            created_at: nowIso,
          });
        }

        nextSubmissions = nextSubmissions.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                counted_views: finalViews,
                gross_earnings_cents: earnings.grossEarningsCents,
                platform_fee_cents: earnings.platformFeeCents,
                net_earnings_cents: earnings.netEarningsCents,
                updated_at: nowIso,
              }
            : s
        );
      }

      pushNotification(nextNotifications, prev.profiles, {
        userId: dispute.opened_by,
        type: 'dispute_resolved',
        title: `Dispute ${
          parsed.decision === 'resolved_overturned' ? 'Resolved in Your Favor' : 'Reviewed & Upheld'
        }`,
        body: `Admin note: "${parsed.resolution_note}"`,
        actionUrl: '/editor/submissions',
      });

      pushNotification(nextNotifications, prev.profiles, {
        userId: dispute.against_user_id,
        type: 'dispute_resolved',
        title: `Dispute resolved on ${sub.file_name}`,
        body: `Outcome: ${parsed.decision}. Note: "${parsed.resolution_note}"`,
        actionUrl: '/holder/posted',
      });

      return {
        ...prev,
        disputes: prev.disputes.map((d) => (d.id === dispute.id ? resolvedDispute : d)),
        view_snapshots: nextSnapshots,
        submissions: nextSubmissions,
        ledger_entries: nextLedger,
        notifications: nextNotifications,
      };
    });

    return resolvedDispute;
  };

  const savePayoutMethod = (input: PayoutMethodDetails) => {
    if (!currentUser) throw new Error('Sign in to save payout method.');
    const parsed = PayoutMethodSchema.parse(input);
    setDb((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) =>
        p.id === currentUser.id
          ? {
              ...p,
              payout_method_type: parsed.type,
              payout_method_details: parsed,
              updated_at: new Date().toISOString(),
            }
          : p
      ),
    }));
  };

  const requestPayout = (input: {
    amount_cents: number;
    currency: CurrencyCode;
    campaign_id?: string | null;
  }): PayoutRequest => {
    if (!currentUser) throw new Error('Sign in to request a payout.');
    if (!currentUser.payout_method_type || !currentUser.payout_method_details) {
      throw new Error('Set up your payout method (GCash, PayPal, or Bank) before requesting a payout.');
    }

    const parsed = RequestPayoutSchema.parse(input);
    const minRequired =
      parsed.currency === 'PHP'
        ? Math.max(50000, db.settings.min_payout_cents)
        : db.settings.min_payout_cents;
    const availableCents = getUserAvailableBalanceCents(currentUser.id, parsed.currency);

    if (availableCents < minRequired) {
      throw new Error(
        `Minimum balance to request a payout is ${formatMoneyCents(minRequired, parsed.currency)}.`
      );
    }
    if (parsed.amount_cents > availableCents) {
      throw new Error(
        `Requested amount exceeds your available balance of ${formatMoneyCents(
          availableCents,
          parsed.currency
        )}.`
      );
    }

    const details = currentUser.payout_method_details;
    const summary =
      details.type === 'gcash'
        ? `GCash ${details.gcash_number} (${details.gcash_name})`
        : details.type === 'paypal'
        ? `PayPal (${details.paypal_email})`
        : `${details.bank_name} ${details.bank_account_number} (${details.bank_account_name})`;

    // Determine primary Account Holder for this editor's earnings
    const editorSub = db.submissions.find(
      (s) => s.editor_id === currentUser.id && ['selected', 'posted'].includes(s.status)
    );
    const linkedCampaign = input.campaign_id
      ? db.campaigns.find((c) => c.id === input.campaign_id)
      : editorSub
      ? db.campaigns.find((c) => c.id === editorSub.campaign_id)
      : db.campaigns[0];

    const nowIso = new Date().toISOString();
    const request: PayoutRequest = {
      id: `pay-${Date.now()}`,
      editor_id: currentUser.id,
      campaign_id: linkedCampaign?.id || null,
      account_holder_id: linkedCampaign?.owner_id || 'holder-1',
      amount_cents: parsed.amount_cents,
      currency: parsed.currency,
      payout_method_type: currentUser.payout_method_type,
      payout_method_summary: summary,
      status: 'pending',
      reference_number: null,
      receipt_url: null,
      paid_by: null,
      created_at: nowIso,
      paid_at: null,
    };

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      if (request.account_holder_id) {
        pushNotification(nextNotifications, prev.profiles, {
          userId: request.account_holder_id,
          type: 'payout_requested',
          title: `Payout requested: ${formatMoneyCents(request.amount_cents, request.currency)} by @${
            currentUser.username
          }`,
          body: `${currentUser.display_name} requested a payout via ${summary}.`,
          actionUrl: '/holder/payouts',
        });
      }
      return {
        ...prev,
        payout_requests: [request, ...prev.payout_requests],
        notifications: nextNotifications,
      };
    });

    return request;
  };

  const markPayoutPaid = (input: {
    payout_request_id?: string;
    payout_id?: string;
    reference_number: string;
    receipt_url?: string;
    receipt_image_url?: string;
  }): PayoutRequest => {
    const parsed = MarkPayoutPaidSchema.parse({
      payout_request_id: input.payout_request_id || input.payout_id || '',
      reference_number: input.reference_number,
      receipt_url: input.receipt_url || input.receipt_image_url,
    });
    const req = db.payout_requests.find((p) => p.id === parsed.payout_request_id);
    if (!req) throw new Error('Payout request not found.');
    if (req.status === 'paid') throw new Error('This payout request is already marked paid.');

    const nowIso = new Date().toISOString();
    const updatedReq: PayoutRequest = {
      ...req,
      status: 'paid',
      reference_number: parsed.reference_number,
      receipt_url: parsed.receipt_url || null,
      paid_by: currentUser?.id || 'admin-1',
      paid_at: nowIso,
    };

    setDb((prev) => {
      const nextNotifications = [...prev.notifications];
      const nextLedger = [...prev.ledger_entries];

      const prevBal = nextLedger
        .filter((l) => l.user_id === req.editor_id && l.currency === req.currency)
        .reduce((s, l) => s + l.amount_cents, 0);

      nextLedger.unshift({
        id: `led-${Date.now()}`,
        user_id: req.editor_id,
        campaign_id: req.campaign_id,
        submission_id: null,
        payout_request_id: req.id,
        entry_type: 'payout',
        amount_cents: -req.amount_cents,
        currency: req.currency,
        balance_after_cents: Math.max(0, prevBal - req.amount_cents),
        description: `Payout marked PAID via ${req.payout_method_summary} (Ref: ${parsed.reference_number})`,
        created_by: currentUser?.id || 'admin-1',
        created_at: nowIso,
      });

      pushNotification(nextNotifications, prev.profiles, {
        userId: req.editor_id,
        type: 'payout_paid',
        title: `Payout of ${formatMoneyCents(req.amount_cents, req.currency)} PAID!`,
        body: `Settled via ${req.payout_method_summary}. Reference: ${parsed.reference_number}.`,
        actionUrl: '/editor/payouts',
      });

      const nextSubmissions = prev.submissions.map((s) => {
        if (
          s.editor_id === req.editor_id &&
          (!req.campaign_id || s.campaign_id === req.campaign_id) &&
          s.status === 'posted'
        ) {
          return { ...s, status: 'paid' as const, updated_at: nowIso };
        }
        return s;
      });

      return {
        ...prev,
        payout_requests: prev.payout_requests.map((p) => (p.id === req.id ? updatedReq : p)),
        ledger_entries: nextLedger,
        submissions: nextSubmissions,
        notifications: nextNotifications,
      };
    });

    return updatedReq;
  };

  const addAdminLedgerAdjustment = (input: {
    user_id: string;
    amount_cents: number;
    currency: CurrencyCode;
    description: string;
  }): LedgerEntry => {
    const nowIso = new Date().toISOString();
    const prevBal = db.ledger_entries
      .filter((l) => l.user_id === input.user_id && l.currency === input.currency)
      .reduce((s, l) => s + l.amount_cents, 0);

    const entry: LedgerEntry = {
      id: `led-${Date.now()}`,
      user_id: input.user_id,
      campaign_id: null,
      submission_id: null,
      payout_request_id: null,
      entry_type: 'adjustment',
      amount_cents: input.amount_cents,
      currency: input.currency,
      balance_after_cents: prevBal + input.amount_cents,
      description: input.description,
      created_by: currentUser?.id || 'admin-1',
      created_at: nowIso,
    };

    setDb((prev) => ({
      ...prev,
      ledger_entries: [entry, ...prev.ledger_entries],
    }));

    return entry;
  };

  const toggleSuspendUser = (userId: string) => {
    setDb((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) =>
        p.id === userId
          ? { ...p, suspended: !p.suspended, updated_at: new Date().toISOString() }
          : p
      ),
    }));
  };

  const updatePlatformSettings = (input: Omit<PlatformSettings, 'id' | 'updated_at'>) => {
    const parsed = AdminSettingsSchema.parse(input);
    setDb((prev) => ({
      ...prev,
      settings: {
        id: 1,
        ...parsed,
        updated_at: new Date().toISOString(),
      },
    }));
  };

  const markNotificationRead = (notificationId: string) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.user_id === currentUser.id ? { ...n, read: true } : n
      ),
    }));
  };

  const resetDemoSeed = () => {
    const fresh = createSeedDatabase();
    setDb(fresh);
    setCurrentUserId('editor-1');
    setPendingOnboarding(null);
    setEmailOutbox([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DB_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.localStorage.removeItem(EMAIL_OUTBOX_KEY);
    }
  };

  const activeRole: ActiveRole = currentUser?.active_role || 'editor';

  const completePasswordlessOnboarding = (input: {
    email: string;
    display_name: string;
    role: 'editor' | 'account_holder' | 'both';
    auth_provider: 'google' | 'magic_link';
  }): Profile => {
    setPendingOnboarding({
      email: input.email,
      provider: input.auth_provider,
    });
    const created = completeOnboarding({
      display_name: input.display_name,
      role: input.role,
    });
    setAuthModalOpen(false);
    return created;
  };

  const updateEditorProfile = (input: {
    display_name: string;
    bio?: string;
    niches: string[];
    portfolio_url?: string;
    sample_clip_urls: string[];
  }) => {
    updateProfile({
      display_name: input.display_name,
      username: currentUser?.username || 'editor',
      bio: input.bio,
      niches: input.niches,
      portfolio_url: input.portfolio_url,
      sample_clip_urls: input.sample_clip_urls,
    });
  };

  const resubmitClip = (input: {
    submission_id: string;
    file_name: string;
    notes: string;
  }): Submission => {
    const existing = db.submissions.find((s) => s.id === input.submission_id);
    if (!existing) throw new Error('Submission not found.');
    return createSubmission({
      campaign_id: existing.campaign_id,
      source_type: existing.source_type,
      storage_path: existing.storage_path,
      external_link: existing.external_link,
      file_name: input.file_name,
      file_size_bytes: existing.file_size_bytes,
      duration_sec: existing.duration_sec,
      suggested_caption: existing.suggested_caption,
      hashtags: existing.hashtags,
      notes: input.notes,
      resubmit_submission_id: existing.id,
    });
  };

  const triggerMissedDeadlineCheck = (): number => {
    const nowMs = Date.now();
    const overdue = db.submissions.filter(
      (s) =>
        s.status === 'selected' &&
        !s.posted_url &&
        s.post_deadline_at &&
        new Date(s.post_deadline_at).getTime() < nowMs
    );
    for (const sub of overdue) {
      flagOverduePostDeadline(sub.id);
    }
    return overdue.length;
  };

  const submitPostUrlForClip = (input: {
    submission_id: string;
    post_url: string;
    initial_views: number;
    proof_url: string;
    submitted_by?: 'holder' | 'editor';
  }): Promise<Submission> => {
    return submitPostUrl({
      submission_id: input.submission_id,
      posted_url: input.post_url,
      posted_platform: 'tiktok',
      initial_views: input.initial_views,
      proof_url: input.proof_url,
      submitted_by: input.submitted_by,
    });
  };

  const recordManualViewSnapshot = (input: {
    submission_id: string;
    views: number;
    proof_url: string;
  }): Promise<ViewSnapshot> => {
    return addViewSnapshot({
      submission_id: input.submission_id,
      views: input.views,
      source: 'manual',
      proof_url: input.proof_url,
    });
  };

  const getEditorWalletSummary = (userId: string) => {
    const availableBalanceCents = getUserAvailableBalanceCents(userId, 'USD');
    const totalEarnedCents = getUserTotalEarnedCents(userId, 'USD');
    const totalPaidCents = db.payout_requests
      .filter((p) => p.editor_id === userId && p.status === 'paid')
      .reduce((s, p) => s + p.amount_cents, 0);
    const pendingPayoutCents = db.payout_requests
      .filter((p) => p.editor_id === userId && p.status === 'pending')
      .reduce((s, p) => s + p.amount_cents, 0);
    const profile = db.profiles.find((p) => p.id === userId);
    const canRequestPayout = availableBalanceCents >= db.settings.min_payout_cents;
    const needsPayoutSetup = totalEarnedCents > 0 && !profile?.payout_method_type;

    return {
      availableBalanceCents,
      totalEarnedCents,
      totalPaidCents,
      pendingPayoutCents,
      canRequestPayout,
      needsPayoutSetup,
    };
  };

  return (
    <WhapContext.Provider
      value={{
        db,
        currentUser,
        activeRole,
        pendingOnboarding,
        emailOutbox,
        authModalOpen,
        setAuthModalOpen,
        authRedirectTarget,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithMagicLink,
        completeOnboarding,
        completePasswordlessOnboarding,
        switchActiveRole,
        switchDemoUser,
        switchDemoPersona: switchDemoUser,
        signOut,
        updateProfile,
        updateEditorProfile,
        createCampaign,
        updateCampaign,
        createSubmission,
        resubmitClip,
        reviewSubmission,
        flagOverduePostDeadline,
        triggerMissedDeadlineCheck,
        submitPostUrl,
        submitPostUrlForClip,
        addViewSnapshot,
        recordManualViewSnapshot,
        openDispute,
        openViewDispute: openDispute,
        resolveDispute,
        savePayoutMethod,
        getUserAvailableBalanceCents,
        getUserTotalEarnedCents,
        getEditorWalletSummary,
        requestPayout,
        markPayoutPaid,
        addAdminLedgerAdjustment,
        toggleSuspendUser,
        updatePlatformSettings,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoSeed,
        resetToInitialSeed: resetDemoSeed,
      }}
    >
      {children}
    </WhapContext.Provider>
  );
}

export function useWhap() {
  const ctx = useContext(WhapContext);
  if (!ctx) throw new Error('useWhap must be used within WhapProvider');
  return ctx;
}
