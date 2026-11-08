import {
  AccountHolderReputation,
  Campaign,
  CurrencyCode,
  Dispute,
  PayoutRequest,
  Submission,
  ViewSnapshot,
} from './types';

export interface ClipEarningsInput {
  countedViews: number;
  ratePer1kCents: number;
  baseFeeCents: number;
  maxPayoutPerClipCents: number;
  remainingCampaignBudgetCents?: number;
  platformFeePercent?: number;
}

export interface ClipEarningsResult {
  countedViews: number;
  rawViewBonusCents: number;
  cappedViewBonusCents: number;
  baseFeeCents: number;
  uncappedGrossCents: number;
  grossEarningsCents: number;
  platformFeeCents: number;
  netEarningsCents: number;
  cappedByClipMax: boolean;
  cappedByCampaignBudget: boolean;
}

/**
 * Core Payout Formula:
 * earnings = base_fee + min(counted_views / 1000 * rate_per_1k, max_payout_per_clip)
 * Clamped to the campaign's remaining budget cap so campaign accruals never exceed total_budget_cap_cents.
 */
export function calculateClipEarningsCents(input: ClipEarningsInput): ClipEarningsResult {
  const safeViews = Math.max(0, Math.floor(input.countedViews || 0));
  const safeRate = Math.max(0, Math.floor(input.ratePer1kCents || 0));
  const safeBase = Math.max(0, Math.floor(input.baseFeeCents || 0));
  const safeMaxClip = Math.max(0, Math.floor(input.maxPayoutPerClipCents || 0));
  const feePercent = Math.max(0, input.platformFeePercent ?? 0);

  const rawViewBonusCents = Math.round((safeViews / 1000) * safeRate);
  const cappedViewBonusCents = Math.min(rawViewBonusCents, safeMaxClip);
  const uncappedGrossCents = safeBase + cappedViewBonusCents;

  const remainingBudget =
    typeof input.remainingCampaignBudgetCents === 'number'
      ? Math.max(0, Math.floor(input.remainingCampaignBudgetCents))
      : Number.MAX_SAFE_INTEGER;

  const grossEarningsCents = Math.max(0, Math.min(uncappedGrossCents, remainingBudget));
  const platformFeeCents = Math.round(grossEarningsCents * (feePercent / 100));
  const netEarningsCents = Math.max(0, grossEarningsCents - platformFeeCents);

  return {
    countedViews: safeViews,
    rawViewBonusCents,
    cappedViewBonusCents,
    baseFeeCents: safeBase,
    uncappedGrossCents,
    grossEarningsCents,
    platformFeeCents,
    netEarningsCents,
    cappedByClipMax: rawViewBonusCents >= safeMaxClip && safeMaxClip > 0,
    cappedByCampaignBudget: uncappedGrossCents > remainingBudget,
  };
}

/**
 * Returns the latest verified view count inside the campaign's tracking window.
 */
export function getLatestVerifiedViewsInWindow(
  snapshots: ViewSnapshot[],
  trackingEndsAt: string | null
): number {
  if (!snapshots || snapshots.length === 0) return 0;

  const windowEndMs = trackingEndsAt ? new Date(trackingEndsAt).getTime() : Number.MAX_SAFE_INTEGER;

  const eligible = snapshots
    .filter((snap) => {
      if (!snap.verified) return false;
      const snapMs = new Date(snap.created_at).getTime();
      return snapMs <= windowEndMs;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return eligible.length > 0 ? eligible[0].views : 0;
}

export interface CampaignBudgetSummary {
  totalBudgetCapCents: number;
  accruedBudgetCents: number;
  remainingBudgetCents: number;
  percentUsed: number;
  isExhausted: boolean;
  selectedClipsCount: number;
}

export function calculateCampaignBudgetSummary(
  campaign: Campaign,
  submissions: Submission[],
  excludeSubmissionId?: string
): CampaignBudgetSummary {
  const campaignSubs = submissions.filter(
    (s) =>
      s.campaign_id === campaign.id &&
      s.id !== excludeSubmissionId &&
      ['selected', 'posted', 'paid'].includes(s.status)
  );

  const accruedBudgetCents = campaignSubs.reduce((sum, s) => sum + (s.gross_earnings_cents || 0), 0);
  const remainingBudgetCents = Math.max(0, campaign.total_budget_cap_cents - accruedBudgetCents);
  const percentUsed =
    campaign.total_budget_cap_cents > 0
      ? Math.min(100, Math.round((accruedBudgetCents / campaign.total_budget_cap_cents) * 100))
      : 0;

  return {
    totalBudgetCapCents: campaign.total_budget_cap_cents,
    accruedBudgetCents,
    remainingBudgetCents,
    percentUsed,
    isExhausted: remainingBudgetCents <= 0,
    selectedClipsCount: campaignSubs.length,
  };
}

/**
 * Computes Account Holder trust & transparency profile stats:
 * campaigns run, clips selected, total paid out, % posted on time, disputes
 */
export function calculateAccountHolderReputation(
  holderId: string,
  campaigns: Campaign[],
  submissions: Submission[],
  payoutRequests: PayoutRequest[],
  disputes: Dispute[],
  nowIso: string = new Date().toISOString()
): AccountHolderReputation {
  const holderCampaigns = campaigns.filter((c) => c.owner_id === holderId);
  const campaignIds = new Set(holderCampaigns.map((c) => c.id));

  const holderSubmissions = submissions.filter((s) => campaignIds.has(s.campaign_id));
  const selectedSubs = holderSubmissions.filter((s) =>
    ['selected', 'posted', 'paid'].includes(s.status)
  );

  let postedOnTimeCount = 0;
  let missedDeadlinesCount = 0;
  const nowMs = new Date(nowIso).getTime();

  for (const sub of selectedSubs) {
    const deadlineMs = sub.post_deadline_at ? new Date(sub.post_deadline_at).getTime() : null;
    if (sub.posted_at) {
      const postedMs = new Date(sub.posted_at).getTime();
      if (!deadlineMs || postedMs <= deadlineMs) {
        postedOnTimeCount++;
      } else {
        missedDeadlinesCount++;
      }
    } else if (sub.missed_post_deadline || (deadlineMs && nowMs > deadlineMs)) {
      missedDeadlinesCount++;
    } else {
      // Still within active 72h posting window
      postedOnTimeCount++;
    }
  }

  const onTimePercent =
    selectedSubs.length > 0 ? Math.round((postedOnTimeCount / selectedSubs.length) * 100) : 100;

  const paidFromSubsCents = holderSubmissions
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + s.gross_earnings_cents, 0);

  const paidFromRequestsCents = payoutRequests
    .filter((p) => p.account_holder_id === holderId && p.status === 'paid')
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const totalPaidOutCents = Math.max(paidFromSubsCents, paidFromRequestsCents);

  const holderDisputes = disputes.filter(
    (d) => d.against_user_id === holderId || campaignIds.has(d.campaign_id)
  );

  return {
    holder_id: holderId,
    campaigns_run: holderCampaigns.length,
    clips_selected: selectedSubs.length,
    total_paid_out_cents: totalPaidOutCents,
    on_time_post_percent: onTimePercent,
    disputes_count: holderDisputes.length,
    missed_deadlines_count: missedDeadlinesCount,
  };
}

export function formatMoneyCents(cents: number, currency: CurrencyCode = 'USD'): string {
  const symbol = currency === 'PHP' ? '₱' : '$';
  const isNegative = cents < 0;
  const absDollars = Math.abs(cents) / 100;
  const formatted = absDollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function getPostDeadlineStatus(
  submission: Submission,
  nowIso: string = new Date().toISOString()
): {
  state: 'not_selected' | 'posted_on_time' | 'posted_late' | 'awaiting_post' | 'overdue';
  hoursRemaining: number;
  label: string;
} {
  if (!['selected', 'posted', 'paid'].includes(submission.status)) {
    return { state: 'not_selected', hoursRemaining: 0, label: 'Pending review' };
  }

  const deadlineMs = submission.post_deadline_at
    ? new Date(submission.post_deadline_at).getTime()
    : Date.now() + 72 * 3600 * 1000;

  if (submission.posted_url && submission.posted_at) {
    const postedMs = new Date(submission.posted_at).getTime();
    if (postedMs <= deadlineMs) {
      return { state: 'posted_on_time', hoursRemaining: 0, label: 'Posted on time' };
    }
    return { state: 'posted_late', hoursRemaining: 0, label: 'Posted after 72h deadline' };
  }

  const nowMs = new Date(nowIso).getTime();
  const diffHours = Math.round(((deadlineMs - nowMs) / (1000 * 3600)) * 10) / 10;

  if (submission.missed_post_deadline || diffHours <= 0) {
    return {
      state: 'overdue',
      hoursRemaining: diffHours,
      label: `Overdue by ${Math.abs(Math.floor(diffHours))}h (Flagged)`,
    };
  }

  return {
    state: 'awaiting_post',
    hoursRemaining: diffHours,
    label: `${Math.ceil(diffHours)}h left to post URL`,
  };
}

export function getViewUpdateReminderStatus(
  submission: Submission,
  intervalDays: number = 7,
  nowIso: string = new Date().toISOString()
): {
  isDue: boolean;
  daysSinceLastUpdate: number;
  daysUntilDue: number;
  trackingActive: boolean;
  label: string;
} {
  if (!submission.posted_at || !['posted', 'paid'].includes(submission.status)) {
    return {
      isDue: false,
      daysSinceLastUpdate: 0,
      daysUntilDue: intervalDays,
      trackingActive: false,
      label: 'Not posted yet',
    };
  }

  const nowMs = new Date(nowIso).getTime();
  const endsMs = submission.tracking_ends_at
    ? new Date(submission.tracking_ends_at).getTime()
    : nowMs + 30 * 86400 * 1000;
  const trackingActive = nowMs <= endsMs;

  const refDate = submission.last_view_update_at || submission.posted_at;
  const refMs = new Date(refDate).getTime();
  const daysSince = Math.floor((nowMs - refMs) / (1000 * 86400));
  const daysUntilDue = intervalDays - daysSince;

  if (!trackingActive) {
    return {
      isDue: false,
      daysSinceLastUpdate: daysSince,
      daysUntilDue: 0,
      trackingActive: false,
      label: 'Tracking window completed',
    };
  }

  if (daysSince >= intervalDays) {
    return {
      isDue: true,
      daysSinceLastUpdate: daysSince,
      daysUntilDue,
      trackingActive: true,
      label: `View update overdue (${daysSince}d since last snapshot)`,
    };
  }

  return {
    isDue: false,
    daysSinceLastUpdate: daysSince,
    daysUntilDue,
    trackingActive: true,
    label: `Updated ${daysSince}d ago (next due in ${daysUntilDue}d)`,
  };
}
