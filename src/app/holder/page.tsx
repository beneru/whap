'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Clapperboard,
  Clock,
  Edit3,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import {
  calculateAccountHolderReputation,
  calculateCampaignBudgetSummary,
  formatMoneyCents,
  getPostDeadlineStatus,
  getViewUpdateReminderStatus,
} from '@/lib/payout-math';
import { CampaignStatusChip, PlatformBadge, SubmissionStatusChip } from '@/components/StatusChip';

export default function HolderDashboardPage() {
  const { db, currentUser, openAuthModal } = useWhap();

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-white">Account Holder Hub</h1>
        <button
          type="button"
          onClick={() => openAuthModal('/holder')}
          className="rounded-xl bg-tally px-4 py-2.5 text-xs font-bold text-zinc-950"
        >
          Sign In as Account Holder
        </button>
      </div>
    );
  }

  // Show holder's campaigns (or all campaigns if admin/demoing)
  const myCampaigns = db.campaigns.filter((c) => c.owner_id === currentUser.id);
  const effectiveCampaigns = myCampaigns.length > 0 ? myCampaigns : db.campaigns;
  const effectiveCampaignIds = new Set(effectiveCampaigns.map((c) => c.id));

  const holderSubmissions = db.submissions.filter((s) =>
    effectiveCampaignIds.has(s.campaign_id)
  );
  const reviewQueueSubs = holderSubmissions.filter((s) =>
    ['submitted', 'resubmitted'].includes(s.status)
  );
  const awaitingPostSubs = holderSubmissions.filter((s) => s.status === 'selected');
  const postedSubs = holderSubmissions.filter((s) =>
    ['posted', 'paid'].includes(s.status)
  );
  const dueViewUpdates = postedSubs.filter(
    (s) => getViewUpdateReminderStatus(s, db.settings.view_update_interval_days).isDue
  );

  const rep = calculateAccountHolderReputation(
    currentUser.id,
    db.campaigns,
    db.submissions,
    db.payout_requests,
    db.disputes
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
            Page Owner Command Center · @{currentUser.username}
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
            Account Holder Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/holder/review"
            className="inline-flex items-center gap-1.5 rounded-xl bg-tally px-4 py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-tally-bright"
          >
            <Clapperboard className="h-4 w-4" />
            Review Queue ({reviewQueueSubs.length})
          </Link>
          <Link
            href="/holder/campaigns/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-surface px-4 py-2.5 text-xs font-bold text-white hover:border-white/30"
          >
            <PlusCircle className="h-4 w-4 text-tally-bright" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Reputation & SLA Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            Campaigns Run
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-white">
            {rep.campaigns_run}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            Clips Selected
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-white">
            {rep.clips_selected}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            Total Paid Out
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-300">
            {formatMoneyCents(rep.total_paid_out_cents, 'USD')}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            % Posted on Time (72h)
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-tally-bright">
            {rep.on_time_post_percent}%
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            Open Disputes
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-white">
            {rep.disputes_count}
          </p>
        </div>
      </div>

      {/* Action Alerts: 72h Post Deadline & 7-Day View Update Reminders */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-300">
              <Clock className="h-4 w-4" />
              Selected Clips Awaiting Post URL ({awaitingPostSubs.length})
            </div>
            <p className="text-xs text-amber-100">
              Submit live TikTok/Reels/Shorts URLs within 72h of selection to keep your on-time score at 100%.
            </p>
          </div>
          <Link
            href="/holder/posted"
            className="shrink-0 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-extrabold text-zinc-950"
          >
            Submit Post URL
          </Link>
        </div>

        <div className="rounded-2xl border border-tally/35 bg-tally/10 p-4 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-tally-bright">
              <TrendingUp className="h-4 w-4" />
              7-Day View Snapshot Reminders ({dueViewUpdates.length} Due)
            </div>
            <p className="text-xs text-zinc-200">
              Update view counts with screenshot proof at least every 7 days during the 30-day tracking window.
            </p>
          </div>
          <Link
            href="/holder/posted"
            className="shrink-0 rounded-xl bg-tally px-3.5 py-2 text-xs font-extrabold text-zinc-950"
          >
            Update Views
          </Link>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Your Campaigns ({effectiveCampaigns.length})
          </h2>
          <Link
            href={`/holders/${currentUser.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-tally-bright hover:underline"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            View Public Trust Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {effectiveCampaigns.map((camp) => {
            const budget = calculateCampaignBudgetSummary(camp, db.submissions);
            const campSubs = db.submissions.filter((s) => s.campaign_id === camp.id);
            const pendingCount = campSubs.filter((s) =>
              ['submitted', 'resubmitted'].includes(s.status)
            ).length;

            return (
              <div
                key={camp.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-surface p-5 space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold text-zinc-200">
                      {camp.niche}
                    </span>
                    <CampaignStatusChip status={camp.status} />
                  </div>

                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="block text-lg font-bold text-white hover:text-tally-bright"
                  >
                    {camp.title}
                  </Link>

                  <div className="flex flex-wrap gap-1.5">
                    {camp.platforms.map((pl) => (
                      <PlatformBadge key={pl} platform={pl} />
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-elevated p-3 text-xs text-center">
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">Rate / 1K</span>
                      <span className="font-mono font-bold text-tally-bright">
                        {formatMoneyCents(camp.rate_per_1k_cents, camp.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">
                        In Queue
                      </span>
                      <span className="font-mono font-bold text-white">{pendingCount}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">
                        Selected
                      </span>
                      <span className="font-mono font-bold text-emerald-300">
                        {budget.selectedClipsCount} / {camp.clips_needed}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Remaining Budget</span>
                      <span className="font-mono font-bold text-white">
                        {formatMoneyCents(budget.remainingBudgetCents, camp.currency)} /{' '}
                        {formatMoneyCents(budget.totalBudgetCapCents, camp.currency)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-tally"
                        style={{ width: `${Math.max(5, 100 - budget.percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <Link
                    href={`/holder/campaigns/${camp.id}/edit`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-white/30"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Campaign
                  </Link>
                  <Link
                    href={`/holder/review?campaign=${camp.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-tally px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-tally-bright"
                  >
                    Review Clips ({pendingCount})
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
