import { NextResponse } from 'next/server';
import { createSeedDatabase } from '@/lib/seed-data';
import { calculateClipEarningsCents, calculateCampaignBudgetSummary } from '@/lib/payout-math';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const seed = createSeedDatabase();
  const sampleCalc = calculateClipEarningsCents({
    countedViews: 24000,
    ratePer1kCents: 150,
    baseFeeCents: 500,
    maxPayoutPerClipCents: 6000,
    remainingCampaignBudgetCents: 50000,
  });

  const camp1Budget = calculateCampaignBudgetSummary(seed.campaigns[0], seed.submissions);

  return NextResponse.json({
    app: 'whap',
    status: 'ok',
    supabaseConfigured: isSupabaseConfigured(),
    seedStats: {
      accountHolders: seed.profiles.filter((p) => p.role === 'account_holder' || p.role === 'both').length,
      editors: seed.profiles.filter((p) => p.role === 'editor' || p.role === 'both').length,
      campaigns: seed.campaigns.length,
      submissions: seed.submissions.length,
      statusesPresent: Array.from(new Set(seed.submissions.map((s) => s.status))),
    },
    payoutMathCheck: {
      formula: 'earnings = base_fee + min(counted_views / 1000 * rate_per_1k, max_payout_per_clip)',
      sample24kViewsAt150CentsPlus500Base: sampleCalc,
      campaign1Budget: camp1Budget,
    },
  });
}
