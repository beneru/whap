'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { FunnelSimple, MagnifyingGlass, PlusCircle } from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { PlatformType } from '@/lib/types';
import { CampaignCard } from '@/components/CampaignCard';
import { ClappyMascot } from '@/components/ClappyMascot';

export default function CampaignsListPage() {
  const { db, activeRole } = useWhap();
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState<PlatformType | 'ALL'>('ALL');
  const [minRateFilter, setMinRateFilter] = useState<number>(0);

  const niches = useMemo(() => {
    const set = new Set(db.campaigns.map((c) => c.niche));
    return ['ALL', ...Array.from(set)];
  }, [db.campaigns]);

  const filteredCampaigns = useMemo(() => {
    return db.campaigns.filter((c) => {
      if (nicheFilter !== 'ALL' && c.niche !== nicheFilter) return false;
      if (platformFilter !== 'ALL' && !c.platforms.includes(platformFilter)) {
        return false;
      }
      if (minRateFilter > 0 && c.rate_per_1k_cents < minRateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesBrief = c.brief.toLowerCase().includes(q);
        const matchesNiche = c.niche.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrief && !matchesNiche) return false;
      }
      return true;
    });
  }, [db.campaigns, nicheFilter, platformFilter, minRateFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">
            Clipping Campaigns
          </h1>
          <p className="mt-1 text-sm text-muted">
            Filter by niche, platform, or pay rate. Browse logged out and tap Submit
            when you have a clip ready.
          </p>
        </div>

        {activeRole === 'account_holder' && (
          <Link href="/holder/campaigns/new" className="btn-sticker btn-primary">
            <PlusCircle weight="bold" className="h-5 w-5" />
            <span>Post New Campaign</span>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card-sticker bg-mint p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="filter-search"
            className="mb-1.5 block text-xs font-extrabold text-ink"
          >
            Search keywords
          </label>
          <div className="relative">
            <input
              id="filter-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Podcast, Valorant, AI..."
              className="input-sticker pl-9"
            />
            <MagnifyingGlass
              weight="bold"
              className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="filter-niche"
            className="mb-1.5 block text-xs font-extrabold text-ink"
          >
            Niche
          </label>
          <select
            id="filter-niche"
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="input-sticker"
          >
            {niches.map((n) => (
              <option key={n} value={n}>
                {n === 'ALL' ? 'All Niches' : n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-platform"
            className="mb-1.5 block text-xs font-extrabold text-ink"
          >
            Platform
          </label>
          <select
            id="filter-platform"
            value={platformFilter}
            onChange={(e) =>
              setPlatformFilter(e.target.value as PlatformType | 'ALL')
            }
            className="input-sticker"
          >
            <option value="ALL">All Platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="ig_reels">IG Reels</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="fb_reels">FB Reels</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-rate"
            className="mb-1.5 block text-xs font-extrabold text-ink"
          >
            Minimum pay rate
          </label>
          <select
            id="filter-rate"
            value={minRateFilter}
            onChange={(e) => setMinRateFilter(Number(e.target.value))}
            className="input-sticker"
          >
            <option value={0}>Any pay rate</option>
            <option value={100}>$1.00+ / 1K views</option>
            <option value={150}>$1.50+ / 1K views</option>
            <option value={200}>$2.00+ / 1K views</option>
          </select>
        </div>
      </div>

      {/* Results Grid or Empty State with Clappy */}
      {filteredCampaigns.length === 0 ? (
        <div className="card-sticker bg-mint p-10 flex flex-col items-center justify-center text-center space-y-3">
          <ClappyMascot variant="empty" size={96} />
          <h2 className="font-display text-2xl text-ink">
            No campaigns match those filters
          </h2>
          <p className="max-w-md text-sm text-muted">
            Try clearing your search or picking a different platform to see open
            briefs.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setNicheFilter('ALL');
              setPlatformFilter('ALL');
              setMinRateFilter(0);
            }}
            className="btn-sticker btn-primary"
          >
            <FunnelSimple weight="bold" className="h-5 w-5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((camp) => {
            const owner = db.profiles.find((p) => p.id === camp.owner_id);
            return (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                submissions={db.submissions}
                ownerHandle={owner?.username}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
