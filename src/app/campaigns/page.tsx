'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Filter, Search, ShieldCheck } from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import {
  calculateAccountHolderReputation,
  calculateCampaignBudgetSummary,
  formatMoneyCents,
} from '@/lib/payout-math';
import { CampaignStatusChip, PlatformBadge } from '@/components/StatusChip';
import { PlatformId } from '@/lib/types';

export default function CampaignsListPage() {
  const { db } = useWhap();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | 'ALL'>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<'ALL' | 'USD' | 'PHP'>('ALL');
  const [sortBy, setSortBy] = useState<'highest_rate' | 'remaining_budget' | 'newest'>('highest_rate');

  const niches = useMemo(() => {
    return ['ALL', ...Array.from(new Set(db.campaigns.map((c) => c.niche)))];
  }, [db.campaigns]);

  const filteredCampaigns = useMemo(() => {
    return db.campaigns
      .filter((c) => {
        if (selectedNiche !== 'ALL' && c.niche !== selectedNiche) return false;
        if (selectedPlatform !== 'ALL' && !c.platforms.includes(selectedPlatform)) return false;
        if (selectedCurrency !== 'ALL' && c.currency !== selectedCurrency) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = c.title.toLowerCase().includes(q);
          const matchBrief = c.brief.toLowerCase().includes(q);
          const matchHandle = c.target_page_handles.some((h) => h.toLowerCase().includes(q));
          if (!matchTitle && !matchBrief && !matchHandle) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_rate') {
          const normA = a.currency === 'PHP' ? a.rate_per_1k_cents / 56 : a.rate_per_1k_cents;
          const normB = b.currency === 'PHP' ? b.rate_per_1k_cents / 56 : b.rate_per_1k_cents;
          return normB - normA;
        }
        if (sortBy === 'remaining_budget') {
          const remA = calculateCampaignBudgetSummary(a, db.submissions).remainingBudgetCents;
          const remB = calculateCampaignBudgetSummary(b, db.submissions).remainingBudgetCents;
          return remB - remA;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [db.campaigns, db.submissions, selectedNiche, selectedPlatform, selectedCurrency, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
            Public Marketplace · No Login Required to Browse
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
            Clipping Campaigns
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Filter by niche, platform, and pay rate per 1,000 views. Every campaign shows real-time remaining budget.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-surface p-4 sm:grid-cols-12">
        <div className="sm:col-span-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, brief, or @pagehandle..."
            className="w-full rounded-xl border border-white/10 bg-inset pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-tally-bright focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            aria-label="Filter by niche"
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-inset px-3 py-2 text-xs text-zinc-200 focus:border-tally-bright focus:outline-none"
          >
            {niches.map((n) => (
              <option key={n} value={n}>
                {n === 'ALL' ? 'All Niches' : `Niche: ${n}`}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            aria-label="Filter by platform"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as PlatformId | 'ALL')}
            className="w-full rounded-xl border border-white/10 bg-inset px-3 py-2 text-xs text-zinc-200 focus:border-tally-bright focus:outline-none"
          >
            <option value="ALL">All Platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="ig_reels">IG Reels</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="fb_reels">FB Reels</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            aria-label="Sort campaigns"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'highest_rate' | 'remaining_budget' | 'newest')
            }
            className="w-full rounded-xl border border-white/10 bg-inset px-3 py-2 text-xs text-zinc-200 focus:border-tally-bright focus:outline-none"
          >
            <option value="highest_rate">Sort: Highest Rate / 1K Views</option>
            <option value="remaining_budget">Sort: Most Remaining Budget</option>
            <option value="newest">Sort: Newest Launched</option>
          </select>
        </div>
      </div>

      {/* Campaign Cards */}
      {filteredCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-10 text-center">
          <Filter className="mx-auto h-8 w-8 text-zinc-500" />
          <p className="mt-2 text-sm font-bold text-white">No campaigns match those filters</p>
          <button
            type="button"
            onClick={() => {
              setSelectedNiche('ALL');
              setSelectedPlatform('ALL');
              setSelectedCurrency('ALL');
              setSearchQuery('');
            }}
            className="mt-3 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((camp) => {
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
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">
                      {camp.niche}
                    </span>
                    <CampaignStatusChip status={camp.status} />
                  </div>

                  <Link href={`/campaigns/${camp.id}`} className="block group">
                    <h2 className="text-lg font-bold text-white group-hover:text-tally-bright transition">
                      {camp.title}
                    </h2>
                  </Link>

                  <p className="line-clamp-2 text-xs text-zinc-400 leading-relaxed">{camp.brief}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {camp.platforms.map((pl) => (
                      <PlatformBadge key={pl} platform={pl} />
                    ))}
                    <span className="rounded-md border border-white/10 bg-inset px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                      {camp.aspect_ratio} · {camp.min_length_sec}s-{camp.max_length_sec}s
                    </span>
                  </div>

                  {/* Pay Structure */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-elevated p-3 text-center">
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">Per 1K Views</span>
                      <span className="font-mono text-sm font-extrabold text-tally-bright">
                        {formatMoneyCents(camp.rate_per_1k_cents, camp.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">Base Fee</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {formatMoneyCents(camp.base_fee_cents, camp.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">Max / Clip</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {formatMoneyCents(camp.max_payout_per_clip_cents, camp.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Remaining Budget Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Remaining Campaign Budget</span>
                      <span className="font-mono font-bold text-emerald-300">
                        {formatMoneyCents(budget.remainingBudgetCents, camp.currency)}{' '}
                        <span className="text-zinc-500 font-normal">
                          of {formatMoneyCents(budget.totalBudgetCapCents, camp.currency)}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-tally transition-all"
                        style={{ width: `${Math.max(5, 100 - budget.percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer with Account Holder Trust Stats */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <Link
                    href={`/holders/${camp.owner_id}`}
                    className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-tally-bright" />
                    <span className="font-semibold">@{owner?.username}</span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      ({rep.on_time_post_percent}% on-time)
                    </span>
                  </Link>

                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-tally px-3.5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-tally-bright"
                  >
                    View &amp; Submit
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
