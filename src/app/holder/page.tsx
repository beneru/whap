'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Broadcast,
  Coins,
  CreditCard,
  NotePencil,
  PlusCircle,
  Queue,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import {
  calculateAccountHolderReputation,
  formatMoneyCents,
} from '@/lib/payout-math';
import { CampaignCard } from '@/components/CampaignCard';

export default function AccountHolderDashboardPage() {
  const { db, currentUser } = useWhap();

  const holderId =
    currentUser?.role === 'account_holder' || currentUser?.role === 'both'
      ? currentUser.id
      : 'holder-1';

  const myCampaigns = db.campaigns.filter((c) => c.owner_id === holderId);
  const myCampaignIds = new Set(myCampaigns.map((c) => c.id));
  const incomingSubmissions = db.submissions.filter((s) =>
    myCampaignIds.has(s.campaign_id)
  );
  const reviewQueue = incomingSubmissions.filter(
    (s) => s.status === 'submitted' || s.status === 'resubmitted'
  );
  const awaitingPostUrl = incomingSubmissions.filter(
    (s) => s.status === 'selected' && !s.posted_url
  );

  const rep = calculateAccountHolderReputation(
    holderId,
    db.campaigns,
    db.submissions,
    db.payout_requests,
    db.disputes
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="card-sticker bg-mint p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="chip-sticker bg-sprout text-ink">
            Page Owner Hub
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">
            Account Holder Dashboard
          </h1>
          <p className="text-sm text-muted">
            Post campaigns, review incoming edits one by one, paste live post
            links within 72h, and update weekly view counts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/holder/review" className="btn-sticker btn-primary">
            <Queue weight="bold" className="h-5 w-5" />
            <span>Review Queue ({reviewQueue.length})</span>
          </Link>
          <Link href="/holder/campaigns/new" className="btn-sticker btn-secondary">
            <PlusCircle weight="bold" className="h-5 w-5" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* Scorecard & Action Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-sticker p-5 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Waiting for Review
          </span>
          <p className="font-display text-3xl text-ink tabular-nums">
            {reviewQueue.length}
          </p>
          <Link
            href="/holder/review"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-forest hover:underline"
          >
            <span>Open Review Queue</span>
            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="card-sticker p-5 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Need Post Link (72h)
          </span>
          <p className="font-display text-3xl text-ink tabular-nums">
            {awaitingPostUrl.length}
          </p>
          <Link
            href="/holder/posted"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-forest hover:underline"
          >
            <span>Paste Post Link</span>
            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="card-sticker p-5 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Posted on Time
          </span>
          <p className="font-display text-3xl text-forest tabular-nums">
            {rep.on_time_post_percent}%
          </p>
          <p className="text-xs font-bold text-muted">
            {rep.clips_selected} clips picked total
          </p>
        </div>

        <div className="card-sticker p-5 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Total Paid Out
          </span>
          <p className="font-display text-3xl text-ink tabular-nums">
            {formatMoneyCents(rep.total_paid_out_cents, 'USD')}
          </p>
          <Link
            href="/holder/payouts"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-forest hover:underline"
          >
            <span>Editor Payouts</span>
            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Deadline Alert if any selected clip needs a post URL */}
      {awaitingPostUrl.length > 0 && (
        <div className="card-sticker bg-sun p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <WarningCircle weight="bold" className="h-6 w-6 text-ink shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-extrabold text-ink">
                {awaitingPostUrl.length} picked clip needs a post link within 72
                hours
              </h3>
              <p className="text-xs font-bold text-ink">
                Download the clean video, post it on your page, and paste the link
                so views start counting.
              </p>
            </div>
          </div>
          <Link href="/holder/posted" className="btn-sticker btn-secondary shrink-0">
            <Broadcast weight="bold" className="h-4 w-4" />
            <span>Add Post Link</span>
          </Link>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Your Campaigns</h2>
          <Link
            href="/holder/campaigns/new"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-forest hover:underline"
          >
            <PlusCircle weight="bold" className="h-4 w-4" />
            <span>Create Another Campaign</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myCampaigns.map((camp) => (
            <div key={camp.id} className="space-y-2">
              <CampaignCard campaign={camp} submissions={db.submissions} />
              <div className="flex items-center justify-between text-xs font-extrabold pt-1">
                <Link
                  href={`/campaigns/${camp.id}`}
                  className="inline-flex items-center gap-1 text-forest hover:underline"
                >
                  <CreditCard weight="bold" className="h-3.5 w-3.5" />
                  <span>Pre-Fund with Stripe</span>
                </Link>
                <Link
                  href={`/holder/campaigns/${camp.id}/edit`}
                  className="inline-flex items-center gap-1 text-forest hover:underline"
                >
                  <NotePencil weight="bold" className="h-3.5 w-3.5" />
                  <span>Edit Campaign</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Footer Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/holder/review"
          className="card-sticker p-5 hover:bg-mint flex items-center justify-between"
        >
          <div>
            <h3 className="text-base font-extrabold text-ink">
              1-by-1 Review Queue
            </h3>
            <p className="text-xs text-muted">
              Select, Revise, or Reject in one tap
            </p>
          </div>
          <Queue weight="bold" className="h-6 w-6 text-ink" />
        </Link>

        <Link
          href="/holder/posted"
          className="card-sticker p-5 hover:bg-mint flex items-center justify-between"
        >
          <div>
            <h3 className="text-base font-extrabold text-ink">
              Posted Clips &amp; Views
            </h3>
            <p className="text-xs text-muted">
              Paste post links and log 7-day view counts
            </p>
          </div>
          <Broadcast weight="bold" className="h-6 w-6 text-ink" />
        </Link>

        <Link
          href="/holder/payouts"
          className="card-sticker p-5 hover:bg-mint flex items-center justify-between"
        >
          <div>
            <h3 className="text-base font-extrabold text-ink">
              Pay Editors
            </h3>
            <p className="text-xs text-muted">
              Mark payouts sent with reference numbers
            </p>
          </div>
          <Coins weight="bold" className="h-6 w-6 text-ink" />
        </Link>
      </div>
    </div>
  );
}
