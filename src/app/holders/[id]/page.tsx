'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import {
  calculateAccountHolderReputation,
  formatMoneyCents,
} from '@/lib/payout-math';
import { CampaignCard } from '@/components/CampaignCard';
import { ClappyMascot } from '@/components/ClappyMascot';

export default function AccountHolderProfilePage() {
  const params = useParams<{ id: string }>();
  const { db } = useWhap();

  const holder = db.profiles.find((p) => p.id === params.id);
  if (!holder) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="card-sticker bg-mint p-8 text-center space-y-4">
          <div className="flex justify-center">
            <ClappyMascot variant="lost" size={100} />
          </div>
          <h1 className="font-display text-3xl text-ink">
            Page owner not found
          </h1>
          <Link href="/campaigns" className="btn-sticker btn-primary">
            <ArrowLeft weight="bold" className="h-4 w-4" />
            <span>Back to Campaigns</span>
          </Link>
        </div>
      </div>
    );
  }

  const rep = calculateAccountHolderReputation(
    holder.id,
    db.campaigns,
    db.submissions,
    db.payout_requests,
    db.disputes
  );

  const holderCampaigns = db.campaigns.filter((c) => c.owner_id === holder.id);

  return (
    <div className="space-y-8 pb-10">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm font-extrabold text-forest hover:underline"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" />
        <span>Back to Campaigns</span>
      </Link>

      <div className="card-sticker bg-mint p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="chip-sticker bg-sprout text-ink">
              <ShieldCheck weight="bold" className="h-4 w-4" />
              <span>Page Owner Scorecard</span>
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-ink">
              {holder.display_name} @{holder.username}
            </h1>
            <p className="text-sm text-muted">{holder.bio}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="card-sticker p-4">
            <span className="text-xs font-bold text-muted">Campaigns Run</span>
            <p className="mt-1 font-display text-2xl text-ink tabular-nums">
              {rep.campaigns_run}
            </p>
          </div>
          <div className="card-sticker p-4">
            <span className="text-xs font-bold text-muted">Clips Picked</span>
            <p className="mt-1 font-display text-2xl text-ink tabular-nums">
              {rep.clips_selected}
            </p>
          </div>
          <div className="card-sticker p-4">
            <span className="text-xs font-bold text-muted">Total Paid Out</span>
            <p className="mt-1 font-display text-2xl text-forest tabular-nums">
              {formatMoneyCents(rep.total_paid_out_cents, 'USD')}
            </p>
          </div>
          <div className="card-sticker p-4">
            <span className="text-xs font-bold text-muted">Posted on Time</span>
            <p className="mt-1 font-display text-2xl text-forest tabular-nums">
              {rep.on_time_post_percent}%
            </p>
          </div>
          <div className="card-sticker p-4">
            <span className="text-xs font-bold text-muted">Disputes</span>
            <p className="mt-1 font-display text-2xl text-ink tabular-nums">
              {rep.disputes_count}
            </p>
          </div>
        </div>

        {rep.missed_deadlines_count > 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-sun/50 bg-sun/20 p-3.5 text-xs font-semibold text-ink">
            <WarningCircle weight="bold" className="h-5 w-5 shrink-0 text-amber-700" />
            <span>
              {rep.missed_deadlines_count} selected clip missed the 72-hour post
              link deadline.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-sprout/20 p-3.5 text-xs font-semibold text-ink">
            <CheckCircle weight="bold" className="h-5 w-5 shrink-0 text-forest" />
            <span>100% of picked clips were posted within 72 hours.</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-2xl text-ink">
          Campaigns by @{holder.username}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {holderCampaigns.map((camp) => (
            <CampaignCard
              key={camp.id}
              campaign={camp}
              submissions={db.submissions}
              ownerHandle={holder.username}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
