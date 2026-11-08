import { describe, expect, it } from 'vitest';
import {
  calculateAccountHolderReputation,
  calculateCampaignBudgetSummary,
  calculateClipEarningsCents,
  formatMoneyCents,
  getLatestVerifiedViewsInWindow,
} from '../payout-math';
import { createSeedDatabase } from '../seed-data';
import {
  CampaignSchema,
  CreateSubmissionSchema,
  OnboardingSchema,
  PayoutMethodSchema,
  ReviewActionSchema,
} from '../validation';

describe('whap Payout Math & Budget Cap Enforcement', () => {
  it('computes exact formula: earnings = base_fee + min(counted_views / 1000 * rate_per_1k, max_payout_per_clip)', () => {
    const res = calculateClipEarningsCents({
      countedViews: 24000,
      ratePer1kCents: 150, // $1.50 / 1k
      baseFeeCents: 500, // $5.00 base
      maxPayoutPerClipCents: 6000, // $60.00 max view bonus
      remainingCampaignBudgetCents: 50000,
      platformFeePercent: 0,
    });

    // 24 * $1.50 = $36.00 (3600c) + $5.00 (500c) = $41.00 (4100c)
    expect(res.rawViewBonusCents).toBe(3600);
    expect(res.cappedViewBonusCents).toBe(3600);
    expect(res.grossEarningsCents).toBe(4100);
    expect(res.netEarningsCents).toBe(4100);
    expect(res.cappedByClipMax).toBe(false);
    expect(res.cappedByCampaignBudget).toBe(false);
  });

  it('caps view bonus at max_payout_per_clip', () => {
    const res = calculateClipEarningsCents({
      countedViews: 50000,
      ratePer1kCents: 150, // 50 * 150 = 7500c ($75.00) > 6000c ($60.00)
      baseFeeCents: 500,
      maxPayoutPerClipCents: 6000,
      remainingCampaignBudgetCents: 50000,
    });

    expect(res.rawViewBonusCents).toBe(7500);
    expect(res.cappedViewBonusCents).toBe(6000);
    expect(res.grossEarningsCents).toBe(6500); // $5.00 + $60.00 = $65.00
    expect(res.cappedByClipMax).toBe(true);
  });

  it('stops accruing once campaign total budget cap is reached', () => {
    const res = calculateClipEarningsCents({
      countedViews: 30000,
      ratePer1kCents: 200, // $60.00
      baseFeeCents: 500, // $5.00 -> $65.00 uncapped
      maxPayoutPerClipCents: 8000,
      remainingCampaignBudgetCents: 1800, // Only $18.00 left in campaign budget!
    });

    expect(res.uncappedGrossCents).toBe(6500);
    expect(res.grossEarningsCents).toBe(1800);
    expect(res.cappedByCampaignBudget).toBe(true);
  });

  it('applies platform_fee_percent when configured in admin settings', () => {
    const res = calculateClipEarningsCents({
      countedViews: 10000,
      ratePer1kCents: 200, // $20.00
      baseFeeCents: 0,
      maxPayoutPerClipCents: 8000,
      platformFeePercent: 10, // 10% platform fee
    });

    expect(res.grossEarningsCents).toBe(2000);
    expect(res.platformFeeCents).toBe(200);
    expect(res.netEarningsCents).toBe(1800);
  });

  it('formats USD and PHP integer cents accurately', () => {
    expect(formatMoneyCents(4100, 'USD')).toBe('$41.00');
    expect(formatMoneyCents(25000, 'PHP')).toBe('₱250.00');
  });

  it('filters view snapshots to the latest verified count inside the tracking window', () => {
    const snapshots = [
      {
        id: 's1',
        submission_id: 'sub-1',
        campaign_id: 'camp-1',
        views: 5000,
        source: 'manual' as const,
        proof_url: 'https://example.com/1.png',
        note: null,
        verified: true,
        created_by: 'holder-1',
        created_at: '2026-11-01T00:00:00Z',
      },
      {
        id: 's2',
        submission_id: 'sub-1',
        campaign_id: 'camp-1',
        views: 19500,
        source: 'manual' as const,
        proof_url: 'https://example.com/2.png',
        note: null,
        verified: true,
        created_by: 'holder-1',
        created_at: '2026-11-10T00:00:00Z',
      },
      {
        id: 's3-after-window',
        submission_id: 'sub-1',
        campaign_id: 'camp-1',
        views: 99000,
        source: 'manual' as const,
        proof_url: 'https://example.com/3.png',
        note: null,
        verified: true,
        created_by: 'holder-1',
        created_at: '2026-12-15T00:00:00Z',
      },
    ];

    const counted = getLatestVerifiedViewsInWindow(snapshots, '2026-11-30T23:59:59Z');
    expect(counted).toBe(19500);
  });
});

describe('whap Seed Dataset & Zod Validation Invariants', () => {
  it('seeds 2 account holders, 5 editors, 3 campaigns, and submissions in every status', () => {
    const db = createSeedDatabase();
    const holders = db.profiles.filter((p) => p.role === 'account_holder' || p.role === 'both');
    const editors = db.profiles.filter((p) => p.role === 'editor' || p.role === 'both');

    // holder-1, holder-2 (and editor-1 also has 'both' so can switch roles)
    expect(holders.length).toBeGreaterThanOrEqual(2);
    expect(editors.length).toBeGreaterThanOrEqual(5);
    expect(db.campaigns.length).toBe(3);

    const statuses = new Set(db.submissions.map((s) => s.status));
    expect(statuses.has('submitted')).toBe(true);
    expect(statuses.has('revision_requested')).toBe(true);
    expect(statuses.has('resubmitted')).toBe(true);
    expect(statuses.has('selected')).toBe(true);
    expect(statuses.has('posted')).toBe(true);
    expect(statuses.has('paid')).toBe(true);
    expect(statuses.has('rejected')).toBe(true);

    const budget = calculateCampaignBudgetSummary(db.campaigns[0], db.submissions);
    expect(budget.remainingBudgetCents).toBeLessThan(db.campaigns[0].total_budget_cap_cents);

    const rep = calculateAccountHolderReputation(
      'holder-1',
      db.campaigns,
      db.submissions,
      db.payout_requests,
      db.disputes
    );
    expect(rep.campaigns_run).toBe(2);
    expect(rep.clips_selected).toBeGreaterThan(0);
  });

  it('validates 1-screen onboarding, review notes, and payout methods via Zod', () => {
    expect(() =>
      OnboardingSchema.parse({ display_name: 'R', role: 'editor' })
    ).toThrow();
    expect(
      OnboardingSchema.parse({ display_name: 'Kenji', role: 'both' }).role
    ).toBe('both');

    // Revision request without a note must fail validation
    expect(() =>
      ReviewActionSchema.parse({
        submission_id: 'sub-1',
        decision: 'request_revision',
        note: '',
      })
    ).toThrow();

    // Select without a note succeeds
    expect(
      ReviewActionSchema.parse({
        submission_id: 'sub-1',
        decision: 'select',
      }).decision
    ).toBe('select');

    // GCash payout method requires number and name
    expect(
      PayoutMethodSchema.parse({
        type: 'gcash',
        gcash_number: '09178829401',
        gcash_name: 'Kenji Santos',
      }).type
    ).toBe('gcash');
  });
});
