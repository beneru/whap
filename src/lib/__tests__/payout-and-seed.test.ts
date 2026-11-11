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
  InstructionAssetSchema,
  OnboardingSchema,
  PayoutMethodSchema,
  ReviewActionSchema,
  SubmitPostUrlSchema,
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

  it('validates diverse instruction assets (links, photos, audio, files)', () => {
    // Valid link asset
    const linkAsset = InstructionAssetSchema.parse({
      id: 'asset-link-1',
      type: 'link',
      title: 'Google Drive 4K Raw Footages',
      url: 'https://drive.google.com/drive/folders/test',
      note: 'Starts at minute 4',
    });
    expect(linkAsset.type).toBe('link');

    // Valid photo asset
    const imageAsset = InstructionAssetSchema.parse({
      id: 'asset-img-1',
      type: 'image',
      title: 'Brand Corner Logo (Transparent PNG)',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
      file_name: 'logo.png',
      file_size_bytes: 524288,
      note: 'Pin to top right',
    });
    expect(imageAsset.type).toBe('image');
    expect(imageAsset.file_size_bytes).toBe(524288);

    // Valid audio stem asset
    const audioAsset = InstructionAssetSchema.parse({
      id: 'asset-aud-1',
      type: 'audio',
      title: 'Upbeat Background Track',
      url: 'https://cdn.freesound.org/previews/test.mp3',
      file_name: 'music-bed.mp3',
      note: 'Duck volume during speaking',
    });
    expect(audioAsset.type).toBe('audio');

    // Rejects empty title or empty url
    expect(() =>
      InstructionAssetSchema.parse({
        id: 'bad-1',
        type: 'link',
        title: '',
        url: 'https://test.com',
      })
    ).toThrow();

    expect(() =>
      InstructionAssetSchema.parse({
        id: 'bad-2',
        type: 'audio',
        title: 'Missing URL',
        url: '',
      })
    ).toThrow();
  });

  it('verifies seeded campaigns contain diverse instruction assets (links, photos, audio)', () => {
    const db = createSeedDatabase();
    expect(db.campaigns.length).toBeGreaterThan(0);

    for (const campaign of db.campaigns) {
      expect(campaign.instruction_assets).toBeDefined();
      expect(campaign.instruction_assets!.length).toBeGreaterThanOrEqual(2);

      const types = campaign.instruction_assets!.map((a) => a.type);
      // Ensure at least links and photos or audio are represented
      expect(types).toContain('link');
      const hasMedia = types.includes('image') || types.includes('audio');
      expect(hasMedia).toBe(true);

      for (const asset of campaign.instruction_assets!) {
        expect(asset.id).toBeTruthy();
        expect(asset.title).toBeTruthy();
        expect(asset.url).toBeTruthy();
      }
    }
  });
});

describe('whap Editor Payment Security & Escrow Protection', () => {
  it('calculates campaign escrow summary including funded, held, and available escrow', () => {
    const db = createSeedDatabase();
    const camp = db.campaigns[0];
    const summary = calculateCampaignBudgetSummary(camp, db.submissions);

    expect(summary.fundedEscrowCents).toBeGreaterThanOrEqual(camp.total_budget_cap_cents);
    expect(summary.availableEscrowCents).toBeGreaterThan(0);
    expect(summary.availableEscrowCents).toBeLessThanOrEqual(summary.fundedEscrowCents);
  });

  it('validates editor-initiated post URL submission schema', () => {
    const parsed = SubmitPostUrlSchema.parse({
      submission_id: 'sub-1',
      posted_url: 'https://www.tiktok.com/@apexclipspage/video/7182910291029',
      posted_platform: 'tiktok',
      initial_views: 12500,
      proof_url: 'https://storage.whap.app/proofs/editor-spotted.png',
      submitted_by: 'editor',
    });

    expect(parsed.submitted_by).toBe('editor');
    expect(parsed.posted_platform).toBe('tiktok');
    expect(parsed.initial_views).toBe(12500);
  });

  it('verifies all seeded campaigns have funded escrow balances', () => {
    const db = createSeedDatabase();
    for (const camp of db.campaigns) {
      expect(camp.funded_escrow_cents).toBeDefined();
      expect(camp.funded_escrow_cents).toBeGreaterThan(0);
      expect(camp.funded_escrow_cents).toBeGreaterThanOrEqual(camp.total_budget_cap_cents);
    }
  });
});
