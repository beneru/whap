'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Clapperboard,
  DollarSign,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents, getPostDeadlineStatus } from '@/lib/payout-math';
import { SubmissionStatusChip } from '@/components/StatusChip';

export default function EditorDashboardPage() {
  const {
    db,
    currentUser,
    openAuthModal,
    getUserAvailableBalanceCents,
    getUserTotalEarnedCents,
  } = useWhap();

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-white">Editor Dashboard</h1>
        <p className="text-xs text-zinc-400">
          Sign in with Google or an email magic link to track your submitted clips and earnings.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('/editor')}
          className="rounded-xl bg-tally px-4 py-2.5 text-xs font-bold text-zinc-950"
        >
          Sign In to Editor Hub
        </button>
      </div>
    );
  }

  const mySubs = db.submissions.filter((s) => s.editor_id === currentUser.id);
  const totalViews = mySubs.reduce((sum, s) => sum + s.counted_views, 0);
  const totalEarnedUsd = getUserTotalEarnedCents(currentUser.id, 'USD');
  const totalEarnedPhp = getUserTotalEarnedCents(currentUser.id, 'PHP');
  const availableUsd = getUserAvailableBalanceCents(currentUser.id, 'USD');
  const availablePhp = getUserAvailableBalanceCents(currentUser.id, 'PHP');

  const hasAnyEarnings = totalEarnedUsd > 0 || totalEarnedPhp > 0;
  const needsFirstEarningPayoutMethod = hasAnyEarnings && !currentUser.payout_method_type;
  const minPayoutUsd = db.settings.min_payout_cents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
            Editor Workspace · @{currentUser.username}
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {currentUser.display_name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 rounded-xl bg-tally px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-tally-bright"
          >
            <Clapperboard className="h-4 w-4" />
            Browse Open Campaigns
          </Link>
          <Link
            href="/editor/payouts"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-surface px-4 py-2.5 text-xs font-semibold text-white hover:border-white/30"
          >
            <Wallet className="h-4 w-4 text-tally-bright" />
            Payouts &amp; Ledger
          </Link>
        </div>
      </div>

      {/* FIRST EARNING PAYOUT METHOD PROMPT (Collected ONLY when first earning appears, NOT at signup) */}
      {needsFirstEarningPayoutMethod && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-tally/50 bg-tally/15 p-5 shadow-lg">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-tally-bright">
              <Sparkles className="h-4 w-4" />
              First Earning Unlocked! Set Up Your Payout Method
            </div>
            <p className="text-xs sm:text-sm text-zinc-100">
              You have earned{' '}
              <span className="font-mono font-bold text-white">
                {totalEarnedUsd > 0
                  ? formatMoneyCents(totalEarnedUsd, 'USD')
                  : formatMoneyCents(totalEarnedPhp, 'PHP')}
              </span>
              ! We never ask for payout details at signup. Add your GCash number, PayPal email, or Bank account now so you are ready to withdraw.
            </p>
          </div>
          <Link
            href="/editor/payouts"
            className="shrink-0 rounded-xl bg-tally px-4 py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-tally-bright"
          >
            Add Payout Method &rarr;
          </Link>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400">
            Available Balance
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-300">
            {formatMoneyCents(availableUsd, 'USD')}
          </p>
          {availablePhp > 0 && (
            <p className="font-mono text-xs text-emerald-200">
              + {formatMoneyCents(availablePhp, 'PHP')}
            </p>
          )}
          <span className="mt-1 block text-[11px] text-zinc-400">
            {availableUsd >= minPayoutUsd
              ? 'Ready to request payout!'
              : `${formatMoneyCents(minPayoutUsd, 'USD')} minimum to withdraw`}
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400">
            Lifetime Accrued
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-white">
            {formatMoneyCents(totalEarnedUsd, 'USD')}
          </p>
          {totalEarnedPhp > 0 && (
            <p className="font-mono text-xs text-zinc-300">
              + {formatMoneyCents(totalEarnedPhp, 'PHP')}
            </p>
          )}
          <span className="mt-1 block text-[11px] text-zinc-400">
            Across {mySubs.filter((s) => ['selected', 'posted', 'paid'].includes(s.status)).length}{' '}
            selected clips
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400">
            Verified Views Earned
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-tally-bright">
            {totalViews.toLocaleString()}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">
            Tracked in 30-day windows
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400">
            Total Submissions
          </span>
          <p className="mt-1 font-mono text-2xl font-extrabold text-white">{mySubs.length}</p>
          <span className="mt-1 block text-[11px] text-zinc-400">
            {mySubs.filter((s) => s.status === 'revision_requested').length} awaiting your revision
          </span>
        </div>
      </div>

      {/* Revision Requested Alert if any */}
      {mySubs
        .filter((s) => s.status === 'revision_requested')
        .map((revSub) => (
          <div
            key={revSub.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertCircle className="h-4 w-4" />
                Revision Requested on {revSub.file_name}
              </div>
              <p className="text-xs text-amber-100">&ldquo;{revSub.revision_note}&rdquo;</p>
            </div>
            <Link
              href="/editor/submissions"
              className="shrink-0 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-950"
            >
              Resubmit Revised Clip
            </Link>
          </div>
        ))}

      {/* Submissions & Earnings Table */}
      <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Recent Clip Submissions</h2>
          <Link
            href="/editor/submissions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-tally-bright hover:underline"
          >
            Manage all submissions &amp; disputes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {mySubs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-elevated p-8 text-center space-y-2">
            <p className="text-sm font-bold text-white">You have not submitted a clip yet</p>
            <p className="text-xs text-zinc-400">
              Pick an open campaign and upload your first 9:16 edit in under 2 minutes.
            </p>
            <Link
              href="/campaigns"
              className="mt-2 inline-block rounded-xl bg-tally px-4 py-2 text-xs font-bold text-zinc-950"
            >
              Browse Campaigns
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {mySubs.map((sub) => {
              const camp = db.campaigns.find((c) => c.id === sub.campaign_id);
              const postSla = getPostDeadlineStatus(sub);
              return (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-elevated p-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {sub.file_name}
                      </span>
                      <SubmissionStatusChip status={sub.status} />
                    </div>
                    <p className="text-xs text-zinc-400">
                      Campaign:{' '}
                      <Link
                        href={`/campaigns/${sub.campaign_id}`}
                        className="text-zinc-200 hover:underline"
                      >
                        {camp?.title}
                      </Link>
                    </p>
                    {sub.posted_url && (
                      <a
                        href={sub.posted_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-tally-bright hover:underline"
                      >
                        Live Post URL ({sub.posted_platform})
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {sub.status === 'selected' && (
                      <p
                        className={`font-mono text-[11px] ${
                          postSla.state === 'overdue' ? 'text-red-300' : 'text-amber-300'
                        }`}
                      >
                        72h Posting SLA: {postSla.label}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-5 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="block text-[10px] uppercase text-zinc-400">
                        Verified Views
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {sub.counted_views.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase text-zinc-400">
                        Accrued Earnings
                      </span>
                      <span className="font-mono text-base font-extrabold text-emerald-300">
                        {formatMoneyCents(sub.net_earnings_cents, camp?.currency || 'USD')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
