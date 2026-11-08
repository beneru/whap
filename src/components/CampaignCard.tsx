'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, FilmStrip } from '@phosphor-icons/react';
import { Campaign, Submission } from '@/lib/types';
import { calculateCampaignBudgetSummary, formatMoneyCents } from '@/lib/payout-math';
import { CampaignStatusChip, PlatformBadge } from '@/components/StatusChip';

interface CampaignCardProps {
  campaign: Campaign;
  submissions: Submission[];
  ownerHandle?: string;
}

export function getDaysLeftLabel(deadlineIso: string): string {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Ends today';
  if (days === 1) return '1 day left to submit';
  return `${days} days left to submit`;
}

export function CampaignCard({
  campaign,
  submissions,
  ownerHandle,
}: CampaignCardProps) {
  const budget = calculateCampaignBudgetSummary(campaign, submissions);
  const remainingPct = Math.max(6, Math.min(100, 100 - budget.percentUsed));

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="card-sticker group flex flex-col justify-between p-5 transition-transform duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px]"
    >
      <div>
        {/* Top Row: Niche + Status + Deadline Chip */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full border-2 border-ink bg-mint px-3 py-0.5 text-xs font-extrabold text-ink">
              {campaign.niche}
            </span>
            <CampaignStatusChip status={campaign.status} />
          </div>

          <span className="chip-sticker bg-paper text-ink">
            <Clock weight="bold" className="h-3.5 w-3.5 text-ink" />
            <span>{getDaysLeftLabel(campaign.submission_deadline)}</span>
          </span>
        </div>

        {/* Title & Big Sticker Rate Badge */}
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold leading-snug text-ink group-hover:text-forest">
              {campaign.title}
            </h3>
            {ownerHandle && (
              <p className="text-xs font-bold text-forest">
                Page: @{ownerHandle.replace(/^@/, '')}
              </p>
            )}
          </div>

          {/* Big Sticker Rate Badge in Bagel Fat One (>= 20px) */}
          <div className="shrink-0 -rotate-2 rounded-btn border-2 border-ink bg-sprout px-3 py-1.5 text-center shadow-btn">
            <span className="block font-display text-2xl leading-none text-ink">
              {formatMoneyCents(campaign.rate_per_1k_cents, campaign.currency)}
            </span>
            <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-wide text-ink">
              per 1K views
            </span>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted">{campaign.brief}</p>

        {/* Platform Icons & Specs */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {campaign.platforms.map((pl) => (
            <PlatformBadge key={pl} platform={pl} />
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-paper px-2.5 py-0.5 text-xs font-bold text-ink">
            <FilmStrip weight="bold" className="h-3.5 w-3.5 text-ink" />
            {campaign.aspect_ratio} · {campaign.min_length_sec}-{campaign.max_length_sec}s
          </span>
        </div>
      </div>

      {/* Bottom: Remaining Budget Bar (12px tall, 2px ink border, sprout fill) */}
      <div className="mt-5 space-y-2 border-t-2 border-ink pt-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold text-ink">
          <span>Budget left</span>
          <span className="tabular-nums">
            {formatMoneyCents(budget.remainingBudgetCents, campaign.currency)} of{' '}
            {formatMoneyCents(budget.totalBudgetCapCents, campaign.currency)}
          </span>
        </div>

        <div className="progress-sticker" aria-label="Remaining campaign budget">
          <div
            className="progress-sticker-fill"
            style={{ width: `${remainingPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="font-bold text-muted">
            Base pay:{' '}
            <strong className="font-extrabold text-ink tabular-nums">
              {formatMoneyCents(campaign.base_fee_cents, campaign.currency)}
            </strong>{' '}
            · Max:{' '}
            <strong className="font-extrabold text-ink tabular-nums">
              {formatMoneyCents(
                campaign.base_fee_cents + campaign.max_payout_per_clip_cents,
                campaign.currency
              )}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1 font-extrabold text-forest">
            Open brief
            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
