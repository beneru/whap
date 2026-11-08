'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquareWarning,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';
import { SubmissionStatusChip } from '@/components/StatusChip';
import { calculateCampaignBudgetSummary, formatMoneyCents } from '@/lib/payout-math';

export default function HolderReviewQueuePage() {
  const { db, currentUser, openAuthModal, reviewSubmission } = useWhap();

  const [campaignFilter, setCampaignFilter] = useState<string>('ALL');
  const [queueMode, setQueueMode] = useState<'pending' | 'all'>('pending');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noteInput, setNoteInput] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reviewItems = useMemo(() => {
    return db.submissions.filter((s) => {
      if (campaignFilter !== 'ALL' && s.campaign_id !== campaignFilter) return false;
      if (queueMode === 'pending') {
        return ['submitted', 'resubmitted'].includes(s.status);
      }
      return true;
    });
  }, [db.submissions, campaignFilter, queueMode]);

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <button
          type="button"
          onClick={() => openAuthModal('/holder/review')}
          className="rounded-xl bg-tally px-4 py-2 text-xs font-bold text-zinc-950"
        >
          Sign In to Review Queue
        </button>
      </div>
    );
  }

  const safeIndex =
    reviewItems.length > 0 ? Math.min(currentIndex, reviewItems.length - 1) : 0;
  const activeClip = reviewItems[safeIndex] || null;
  const activeCampaign = activeClip
    ? db.campaigns.find((c) => c.id === activeClip.campaign_id)
    : null;
  const activeEditor = activeClip
    ? db.profiles.find((p) => p.id === activeClip.editor_id)
    : null;
  const budgetSummary =
    activeCampaign && activeClip
      ? calculateCampaignBudgetSummary(activeCampaign, db.submissions, activeClip.id)
      : null;

  const handleDecision = (decision: 'select' | 'request_revision' | 'reject') => {
    if (!activeClip) return;
    setErrorMsg(null);
    setFeedbackToast(null);
    try {
      const updated = reviewSubmission({
        submission_id: activeClip.id,
        decision,
        note: noteInput,
      });
      setNoteInput('');
      if (decision === 'select') {
        setFeedbackToast(
          `Selected ${updated.file_name}! Clean master file is now unlocked and the editor's rate is locked. Submit post URL within 72h.`
        );
      } else if (decision === 'request_revision') {
        setFeedbackToast(`Revision requested on ${updated.file_name}. Editor notified.`);
      } else {
        setFeedbackToast(`Rejected ${updated.file_name}. Editor notified.`);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
            One Clip at a Time · Mobile-First Triage Bay
          </span>
          <h1 className="mt-1 text-2xl font-extrabold text-white">Submission Review Queue</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter review queue by campaign"
            value={campaignFilter}
            onChange={(e) => {
              setCampaignFilter(e.target.value);
              setCurrentIndex(0);
            }}
            className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-xs text-zinc-200"
          >
            <option value="ALL">All Campaigns</option>
            {db.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <div className="flex rounded-xl border border-white/10 bg-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setQueueMode('pending');
                setCurrentIndex(0);
              }}
              className={`rounded-lg px-2.5 py-1.5 font-semibold ${
                queueMode === 'pending'
                  ? 'bg-tally text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pending Review
            </button>
            <button
              type="button"
              onClick={() => {
                setQueueMode('all');
                setCurrentIndex(0);
              }}
              className={`rounded-lg px-2.5 py-1.5 font-semibold ${
                queueMode === 'all'
                  ? 'bg-tally text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Submissions
            </button>
          </div>
        </div>
      </div>

      {feedbackToast && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{feedbackToast}</span>
          </div>
          <Link
            href="/holder/posted"
            className="shrink-0 rounded-lg bg-emerald-500 px-3 py-1 font-bold text-zinc-950"
          >
            Go to Posted &amp; 72h SLA &rarr;
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {!activeClip || !activeCampaign ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-10 text-center space-y-3">
          <ShieldCheck className="mx-auto h-10 w-10 text-tally-bright" />
          <h2 className="text-lg font-bold text-white">Review queue is clear!</h2>
          <p className="text-xs text-zinc-400">
            All submitted and resubmitted clips have been triaged. Switch to &ldquo;All Submissions&rdquo; above to inspect previously reviewed clips.
          </p>
          <button
            type="button"
            onClick={() => setQueueMode('all')}
            className="rounded-xl border border-white/15 bg-elevated px-4 py-2 text-xs font-bold text-white"
          >
            Show All Submissions
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile & Desktop Prev / Next Bar */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface px-4 py-3">
            <button
              type="button"
              onClick={() => setCurrentIndex(Math.max(0, safeIndex - 1))}
              disabled={safeIndex === 0}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/10 bg-elevated px-3.5 py-2 text-xs font-bold text-white transition hover:border-white/25 disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev Clip
            </button>

            <div className="text-center">
              <span className="font-mono text-xs font-bold text-tally-bright">
                Clip {safeIndex + 1} of {reviewItems.length}
              </span>
              <span className="hidden sm:block text-[11px] text-zinc-400">
                {activeCampaign.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentIndex(Math.min(reviewItems.length - 1, safeIndex + 1))
              }
              disabled={safeIndex >= reviewItems.length - 1}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/10 bg-elevated px-3.5 py-2 text-xs font-bold text-white transition hover:border-white/25 disabled:opacity-35"
            >
              Next Clip
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Main 1-Clip-At-A-Time Review Bay */}
          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-white/10 bg-surface p-5 lg:grid-cols-12">
            {/* Left 5 Cols: Protected 9:16 Video Monitor */}
            <div className="lg:col-span-5">
              <ProtectedVideoPlayer
                submission={activeClip}
                editorUsername={activeEditor?.username || 'editor'}
                currency={activeCampaign.currency}
              />
            </div>

            {/* Right 7 Cols: Clip Details + Select / Request Revision / Reject Controls */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[11px] text-zinc-400">Submitted by Editor</span>
                    <h2 className="text-lg font-bold text-white">
                      {activeEditor?.display_name}{' '}
                      <span className="font-mono text-sm text-tally-bright">
                        @{activeEditor?.username}
                      </span>
                    </h2>
                  </div>
                  <SubmissionStatusChip status={activeClip.status} />
                </div>

                {/* Campaign & Rate Lock Summary */}
                <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-white/10 bg-elevated p-3.5 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase text-zinc-400">
                      Rate on Selection
                    </span>
                    <span className="font-mono text-sm font-extrabold text-tally-bright">
                      {formatMoneyCents(
                        activeCampaign.rate_per_1k_cents,
                        activeCampaign.currency
                      )}
                      /1k
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-zinc-400">
                      Base + Max Cap
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {formatMoneyCents(activeCampaign.base_fee_cents, activeCampaign.currency)}{' '}
                      +{' '}
                      {formatMoneyCents(
                        activeCampaign.max_payout_per_clip_cents,
                        activeCampaign.currency
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-zinc-400">
                      Remaining Budget
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-300">
                      {formatMoneyCents(
                        budgetSummary?.remainingBudgetCents || 0,
                        activeCampaign.currency
                      )}
                    </span>
                  </div>
                </div>

                {/* Caption, Hashtags, Notes */}
                <div className="space-y-2.5 rounded-xl border border-white/10 bg-inset p-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400">
                      Suggested Hook Caption
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {activeClip.suggested_caption || 'No caption provided'}
                    </p>
                  </div>
                  {activeClip.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeClip.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-white/5 px-2 py-0.5 font-mono text-[11px] text-tally-bright"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {activeClip.notes && (
                    <div className="border-t border-white/10 pt-2">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">
                        Editor Notes
                      </span>
                      <p className="mt-0.5 text-zinc-300">{activeClip.notes}</p>
                    </div>
                  )}
                  {activeClip.external_link && (
                    <div className="border-t border-white/10 pt-2">
                      <a
                        href={activeClip.external_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-tally-bright hover:underline"
                      >
                        External Source Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {activeClip.revision_note && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <span className="font-bold">Prior Revision Note:</span>{' '}
                    {activeClip.revision_note}
                  </div>
                )}
              </div>

              {/* Decision Controls */}
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Revision Note or Rejection Reason (Required for Revision / Reject)
                  </label>
                  <textarea
                    rows={2}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="e.g. Trim the 1.5s pause at the start and boost caption contrast..."
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-inset p-3 text-xs text-white placeholder-zinc-500 focus:border-tally-bright focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDecision('select')}
                    className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-tally px-4 py-2.5 text-xs font-extrabold text-zinc-950 shadow-lg transition hover:bg-tally-bright"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Select &amp; Unlock File
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision('request_revision')}
                    className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/25"
                  >
                    <MessageSquareWarning className="h-4 w-4" />
                    Request Revision
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision('reject')}
                    className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/25"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Clip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
