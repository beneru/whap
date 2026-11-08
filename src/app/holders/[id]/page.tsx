'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import {
  calculateAccountHolderReputation,
  calculateCampaignBudgetSummary,
  formatMoneyCents,
} from '@/lib/payout-math';
import { CampaignStatusChip, PlatformBadge } from '@/components/StatusChip';

export default function AccountHolderProfilePage() {
  const params = useParams<{ id: string }>();
  const { db } = useWhap();

  const holder = db.profiles.find((p) => p.id === params.id);
  if (!holder) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <p className="text-base font-bold text-white">Account Holder not found</p>
        <Link href="/campaigns" className="mt-2 inline-block text-xs text-tally-bright">
          Back to Campaigns
        </Link>
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
    <div className="space-y-6">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Campaigns
      </Link>

      {/* Profile Header & Editor Protection Metrics */}
      <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-tally/35 bg-tally/10 px-2.5 py-0.5 text-xs font-medium text-tally-bright">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Account Holder · Trust Scorecard
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-white">
              {holder.display_name}{' '}
              <span className="font-mono text-base font-normal text-zinc-400">
                @{holder.username}
              </span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-300">{holder.bio}</p>
          </div>
        </div>

        {/* 5 Required Account Holder Transparency Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-white/10 bg-elevated p-3.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Campaigns Run
            </span>
            <p className="mt-1 font-mono text-xl font-extrabold text-white">
              {rep.campaigns_run}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-elevated p-3.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Clips Selected
            </span>
            <p className="mt-1 font-mono text-xl font-extrabold text-white">
              {rep.clips_selected}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-elevated p-3.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Total Paid Out
            </span>
            <p className="mt-1 font-mono text-xl font-extrabold text-emerald-300">
              {formatMoneyCents(rep.total_paid_out_cents, 'USD')}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-elevated p-3.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              % Posted on Time (72h)
            </span>
            <p
              className={`mt-1 font-mono text-xl font-extrabold ${
                rep.on_time_post_percent >= 90 ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {rep.on_time_post_percent}%
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-elevated p-3.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              Disputes Logged
            </span>
            <p className="mt-1 font-mono text-xl font-extrabold text-white">
              {rep.disputes_count}
            </p>
          </div>
        </div>

        {rep.missed_deadlines_count > 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>
              <strong>Flagged SLA Notice:</strong> This Account Holder has{' '}
              {rep.missed_deadlines_count} selected clip(s) where the live post URL was not
              submitted within the 72-hour deadline.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>100% of selected clips were posted within the 72-hour SLA window.</span>
          </div>
        )}
      </div>

      {/* Campaigns by this Holder */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">
          Campaigns by @{holder.username} ({holderCampaigns.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {holderCampaigns.map((camp) => {
            const budget = calculateCampaignBudgetSummary(camp, db.submissions);
            return (
              <Link
                key={camp.id}
                href={`/campaigns/${camp.id}`}
                className="block rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-tally/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">{camp.niche}</span>
                  <CampaignStatusChip status={camp.status} />
                </div>
                <h3 className="text-base font-bold text-white">{camp.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {camp.platforms.map((pl) => (
                    <PlatformBadge key={pl} platform={pl} />
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <span className="font-mono font-bold text-tally-bright">
                    {formatMoneyCents(camp.rate_per_1k_cents, camp.currency)} / 1K views
                  </span>
                  <span className="font-mono text-zinc-300">
                    Remaining: {formatMoneyCents(budget.remainingBudgetCents, camp.currency)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
