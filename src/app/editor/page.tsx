'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Coins,
  FilmSlate,
  FilmStrip,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { SubmissionStatusChip } from '@/components/StatusChip';
import { ClappyMascot } from '@/components/ClappyMascot';

export default function EditorDashboardPage() {
  const { db, currentUser, getEditorWalletSummary } = useWhap();

  const editorId = currentUser?.id || 'editor-1';
  const editor =
    db.profiles.find((p) => p.id === editorId) || db.profiles[2];
  const wallet = getEditorWalletSummary(editor.id);

  const mySubmissions = db.submissions.filter((s) => s.editor_id === editor.id);
  const needsRevision = mySubmissions.filter(
    (s) => s.status === 'revision_requested'
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Sticker Header */}
      <div className="card-sticker bg-mint p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <ClappyMascot variant="wave" size={84} className="shrink-0" />
          <div className="space-y-1">
            <span className="chip-sticker bg-sprout text-ink">
              Editor Dashboard
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-ink">
              Welcome back, {editor.display_name}
            </h1>
            <p className="text-sm text-muted">
              Check your clip statuses, view counts, and cash out when your balance
              reaches $10.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/campaigns" className="btn-sticker btn-primary">
            <FilmStrip weight="bold" className="h-5 w-5" />
            <span>Find a Campaign</span>
          </Link>
          <Link href="/editor/payouts" className="btn-sticker btn-secondary">
            <Coins weight="bold" className="h-5 w-5" />
            <span>Payouts &amp; Ledger</span>
          </Link>
        </div>
      </div>

      {/* First-Earning Payout Method Prompt (Only shown after first earning appears) */}
      {wallet.needsPayoutSetup && (
        <div className="card-sticker bg-sun p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <WarningCircle weight="bold" className="h-6 w-6 text-ink shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-extrabold text-ink">
                Your clip earned its first cash! Add where we should send your money.
              </h3>
              <p className="text-xs font-bold text-ink">
                Pick GCash, PayPal, or bank transfer on your Payouts page.
              </p>
            </div>
          </div>
          <Link href="/editor/payouts" className="btn-sticker btn-secondary shrink-0">
            <span>Add Payout Method</span>
            <ArrowRight weight="bold" className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Calm Money & Clip Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-sticker p-5 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Available Balance
          </span>
          <p className="font-display text-3xl text-forest tabular-nums">
            {formatMoneyCents(wallet.availableBalanceCents, 'USD')}
          </p>
          <p className="text-xs font-bold text-muted">
            {wallet.canRequestPayout
              ? 'Ready to cash out!'
              : 'Min $10.00 to request payout'}
          </p>
        </div>

        <div className="card-sticker p-5 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Total Earned
          </span>
          <p className="font-display text-3xl text-ink tabular-nums">
            {formatMoneyCents(wallet.totalEarnedCents, 'USD')}
          </p>
          <p className="text-xs font-bold text-muted">
            From base fees + verified views
          </p>
        </div>

        <div className="card-sticker p-5 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Total Paid Out
          </span>
          <p className="font-display text-3xl text-ink tabular-nums">
            {formatMoneyCents(wallet.totalPaidCents, 'USD')}
          </p>
          <p className="text-xs font-bold text-muted">
            Pending: {formatMoneyCents(wallet.pendingPayoutCents, 'USD')}
          </p>
        </div>

        <div className="card-sticker p-5 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Submitted Clips
          </span>
          <p className="font-display text-3xl text-ink tabular-nums">
            {mySubmissions.length}
          </p>
          <p className="text-xs font-bold text-muted">
            {
              mySubmissions.filter(
                (s) =>
                  s.status === 'selected' ||
                  s.status === 'posted' ||
                  s.status === 'paid'
              ).length
            }{' '}
            picked by page owners
          </p>
        </div>
      </div>

      {/* Revision Alert Banner if any clip needs changes */}
      {needsRevision.length > 0 && (
        <div className="card-sticker bg-sun p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-ink">
              {needsRevision.length} clip needs a quick edit
            </h3>
            <p className="text-xs font-bold text-ink">
               Note from page owner: &ldquo;{needsRevision[0].revision_note}&rdquo;
            </p>
          </div>
          <Link
            href="/editor/submissions"
            className="btn-sticker btn-secondary shrink-0 text-xs"
          >
            <span>Send Updated Cut</span>
            <ArrowRight weight="bold" className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Recent Submissions Table */}
      <div className="card-sticker p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Your Recent Clips</h2>
          <Link
            href="/editor/submissions"
            className="text-xs font-extrabold text-forest hover:underline"
          >
            See all clips &rarr;
          </Link>
        </div>

        {mySubmissions.length === 0 ? (
          <div className="rounded-card border-2 border-ink bg-mint p-8 text-center space-y-3">
            <div className="flex justify-center">
              <ClappyMascot variant="empty" size={84} />
            </div>
            <h3 className="text-base font-extrabold text-ink">
              You have not sent a clip yet
            </h3>
            <Link href="/campaigns" className="btn-sticker btn-primary text-xs">
              <FilmSlate weight="bold" className="h-4 w-4" />
              <span>Pick Your First Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink text-xs font-extrabold uppercase text-muted">
                  <th className="py-2.5 pr-4">Clip File</th>
                  <th className="py-2.5 pr-4">Campaign</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5 pr-4 text-right">Counted Views</th>
                  <th className="py-2.5 text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink/20 tabular-nums">
                {mySubmissions.map((sub) => {
                  const camp = db.campaigns.find((c) => c.id === sub.campaign_id);
                  return (
                    <tr key={sub.id} className="hover:bg-mint">
                      <td className="py-3 pr-4 font-extrabold text-ink">
                        {sub.file_name}
                      </td>
                      <td className="py-3 pr-4 text-xs font-bold text-ink">
                        {camp?.title}
                      </td>
                      <td className="py-3 pr-4">
                        <SubmissionStatusChip status={sub.status} />
                      </td>
                      <td className="py-3 pr-4 text-right font-extrabold text-ink">
                        {sub.counted_views.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-extrabold text-forest">
                        {formatMoneyCents(
                          sub.net_earnings_cents,
                          camp?.currency || 'USD'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
