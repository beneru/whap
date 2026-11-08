'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Film,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import {
  calculateAccountHolderReputation,
  calculateCampaignBudgetSummary,
  calculateClipEarningsCents,
  formatMoneyCents,
} from '@/lib/payout-math';
import { CampaignStatusChip, PlatformBadge } from '@/components/StatusChip';

export default function LandingPage() {
  const { db, currentUser, openAuthModal, switchActiveRole } = useWhap();
  const router = useRouter();
  const [simViews, setSimViews] = useState(28000);

  const openCampaigns = db.campaigns.filter((c) => c.status === 'open');
  const featuredCampaign = openCampaigns[0] || db.campaigns[0];

  const simEarnings = calculateClipEarningsCents({
    countedViews: simViews,
    ratePer1kCents: featuredCampaign?.rate_per_1k_cents || 150,
    baseFeeCents: featuredCampaign?.base_fee_cents || 500,
    maxPayoutPerClipCents: featuredCampaign?.max_payout_per_clip_cents || 6000,
    remainingCampaignBudgetCents: 50000,
  });

  return (
    <div className="space-y-12">
      {/* HERO SECTION: Studio Editing Bay & Payout Exchange */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface via-[#121622] to-canvas p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-tally/35 bg-tally/10 px-3 py-1 text-xs font-medium text-tally-bright">
              <span className="h-2 w-2 rounded-full bg-tally-bright animate-pulse" />
              Page Owners Post · Editors Cut · Paid Per 1,000 Verified Views
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.08]">
              You cut the clip.{' '}
              <span className="text-tally-bright">They run the page.</span>{' '}
              Both get paid per view.
            </h1>

            <p className="max-w-2xl text-sm sm:text-base text-zinc-300 leading-relaxed">
              Account Holders run high-traffic TikTok, Reels, and Shorts pages without touching timeline software. Video Editors upload clips in under 2 minutes with watermarked preview protection and locked per-1,000-view rates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-2 rounded-xl bg-tally px-5 py-3 text-sm font-bold text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition hover:bg-tally-bright"
              >
                Browse Open Campaigns ({openCampaigns.length})
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (currentUser) {
                    switchActiveRole('account_holder');
                    router.push('/holder/campaigns/new');
                  } else {
                    openAuthModal('/holder/campaigns/new');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-elevated px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30"
              >
                Launch a Page Campaign
              </button>
            </div>

            {/* Key Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="rounded-xl border border-white/10 bg-canvas/60 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  Watermarked Previews
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Clean master file unlocks only after the Account Holder selects your clip and locks your rate.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-canvas/60 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Clock className="h-3.5 w-3.5 text-tally-bright" />
                  72h Posting SLA
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Selected clips must go live with a verified post URL within 72 hours or the holder is flagged.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-canvas/60 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <UploadCloud className="h-3.5 w-3.5 text-sky-400" />
                  Resumable TUS Uploads
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Built for mobile networks. Survives connection drops and resumes from the exact byte offset.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Live Payout Formula Simulator Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/15 bg-elevated p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-tally-bright">
                    Transparent Payout Engine
                  </span>
                  <h2 className="text-base font-bold text-white">Live Clip Earnings Estimator</h2>
                </div>
                <span className="rounded-lg bg-tally/15 border border-tally/30 px-2.5 py-1 font-mono text-xs font-bold text-tally-bright">
                  USD / PHP
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-inset p-3 font-mono text-xs text-zinc-300">
                <div className="text-[10px] uppercase text-zinc-500 mb-1">Exact Contract Formula</div>
                <code className="text-emerald-300">
                  earnings = base_fee + min(views / 1000 * rate_per_1k, max_payout)
                </code>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Simulated Verified Views (30d Window)</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {simViews.toLocaleString()} views
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={60000}
                  step={1000}
                  value={simViews}
                  onChange={(e) => setSimViews(Number(e.target.value))}
                  aria-label="Simulated Verified Views"
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                  <span>1K views</span>
                  <span>25K views</span>
                  <span>60K views</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-white/10 bg-surface p-2.5">
                  <div className="text-[10px] text-zinc-400">Base Fee</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {formatMoneyCents(simEarnings.baseFeeCents, 'USD')}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-surface p-2.5">
                  <div className="text-[10px] text-zinc-400">
                    View Bonus ($1.50/1k)
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-tally-bright">
                    {formatMoneyCents(simEarnings.cappedViewBonusCents, 'USD')}
                  </div>
                </div>
                <div className="rounded-xl border border-tally/40 bg-tally/15 p-2.5">
                  <div className="text-[10px] text-emerald-200">Editor Payout</div>
                  <div className="mt-0.5 font-mono text-base font-extrabold text-white">
                    {formatMoneyCents(simEarnings.netEarningsCents, 'USD')}
                  </div>
                </div>
              </div>

              {simEarnings.cappedByClipMax && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-mono text-[11px] text-amber-300">
                  Reached per-clip view bonus cap ({formatMoneyCents(6000, 'USD')}) +{' '}
                  {formatMoneyCents(500, 'USD')} base = {formatMoneyCents(6500, 'USD')}.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* OPEN CAMPAIGNS PREVIEW */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
              Live Bounties · Browse Logged Out
            </span>
            <h2 className="mt-1 text-2xl font-bold text-white">Open Clipping Campaigns</h2>
          </div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-tally-bright hover:underline"
          >
            View all campaigns &amp; filters
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {db.campaigns.map((camp) => {
            const owner = db.profiles.find((p) => p.id === camp.owner_id);
            const budget = calculateCampaignBudgetSummary(camp, db.submissions);
            const rep = calculateAccountHolderReputation(
              camp.owner_id,
              db.campaigns,
              db.submissions,
              db.payout_requests,
              db.disputes
            );

            return (
              <div
                key={camp.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-tally/40"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">
                      {camp.niche}
                    </span>
                    <CampaignStatusChip status={camp.status} />
                  </div>

                  <Link href={`/campaigns/${camp.id}`} className="block group">
                    <h3 className="text-lg font-bold text-white group-hover:text-tally-bright transition line-clamp-2">
                      {camp.title}
                    </h3>
                  </Link>

                  <p className="line-clamp-2 text-xs text-zinc-400 leading-relaxed">{camp.brief}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {camp.platforms.map((pl) => (
                      <PlatformBadge key={pl} platform={pl} />
                    ))}
                  </div>

                  {/* Pay Rate Highlight */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-elevated p-3">
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">Rate / 1K Views</span>
                      <span className="font-mono text-base font-extrabold text-tally-bright">
                        {formatMoneyCents(camp.rate_per_1k_cents, camp.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">
                        Base + Max Clip
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {formatMoneyCents(camp.base_fee_cents, camp.currency)} +{' '}
                        {formatMoneyCents(camp.max_payout_per_clip_cents, camp.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Remaining Budget</span>
                      <span className="font-mono font-semibold text-white">
                        {formatMoneyCents(budget.remainingBudgetCents, camp.currency)} /{' '}
                        {formatMoneyCents(budget.totalBudgetCapCents, camp.currency)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-tally"
                        style={{ width: `${Math.max(6, 100 - budget.percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <Link
                    href={`/holders/${camp.owner_id}`}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    <span className="font-semibold text-zinc-200">@{owner?.username}</span> ·{' '}
                    <span className="font-mono text-emerald-300">
                      {rep.on_time_post_percent}% on-time
                    </span>
                  </Link>

                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-tally px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-tally-bright"
                  >
                    Submit Clip
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
