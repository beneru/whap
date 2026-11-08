'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Flag,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents, getPostDeadlineStatus } from '@/lib/payout-math';
import { DisputeStatusChip, SubmissionStatusChip } from '@/components/StatusChip';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';
import { SubmissionStatus } from '@/lib/types';

export default function EditorSubmissionsPage() {
  const { db, currentUser, openAuthModal, createSubmission, openDispute } = useWhap();

  const [statusFilter, setStatusFilter] = useState<'ALL' | SubmissionStatus>('ALL');
  const [resubmitTargetId, setResubmitTargetId] = useState<string | null>(null);
  const [resubmitLink, setResubmitLink] = useState('');
  const [resubmitNotes, setResubmitNotes] = useState('');

  const [disputeTargetSnapshotId, setDisputeTargetSnapshotId] = useState<string | null>(null);
  const [disputeSubmissionId, setDisputeSubmissionId] = useState<string | null>(null);
  const [disputeClaimedViews, setDisputeClaimedViews] = useState(25000);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidenceUrl, setDisputeEvidenceUrl] = useState(
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&auto=format&fit=crop&q=80'
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-white">My Submissions</h1>
        <button
          type="button"
          onClick={() => openAuthModal('/editor/submissions')}
          className="rounded-xl bg-tally px-4 py-2 text-xs font-bold text-zinc-950"
        >
          Sign In
        </button>
      </div>
    );
  }

  const mySubs = db.submissions
    .filter((s) => s.editor_id === currentUser.id)
    .filter((s) => (statusFilter === 'ALL' ? true : s.status === statusFilter));

  const handleResubmit = (e: React.FormEvent, subId: string, campaignId: string) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      createSubmission({
        campaign_id: campaignId,
        source_type: resubmitLink.trim() ? 'link' : 'upload',
        storage_path: resubmitLink.trim() ? null : `${currentUser.id}/${campaignId}/revised-v2.mp4`,
        external_link: resubmitLink.trim() || null,
        file_name: `revised-${Date.now()}.mp4`,
        notes: resubmitNotes || 'Revised clip addressing review feedback.',
        resubmit_submission_id: subId,
      });
      setResubmitTargetId(null);
      setResubmitLink('');
      setResubmitNotes('');
      setFeedbackMsg('Revised clip resubmitted to the Account Holder review queue!');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleOpenDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeTargetSnapshotId || !disputeSubmissionId) return;
    setErrorMsg(null);
    try {
      openDispute({
        snapshot_id: disputeTargetSnapshotId,
        submission_id: disputeSubmissionId,
        reason: disputeReason,
        claimed_views: disputeClaimedViews,
        evidence_url: disputeEvidenceUrl,
      });
      setDisputeTargetSnapshotId(null);
      setDisputeSubmissionId(null);
      setDisputeReason('');
      setFeedbackMsg('Dispute opened on snapshot! Admin and Account Holder have been notified.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
            Clip Lifecycle · View Snapshots · Dispute Protection
          </span>
          <h1 className="mt-1 text-2xl font-extrabold text-white">My Submitted Clips</h1>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              'ALL',
              'submitted',
              'revision_requested',
              'resubmitted',
              'selected',
              'posted',
              'paid',
              'rejected',
            ] as const
          ).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-tally text-zinc-950'
                  : 'border border-white/10 bg-surface text-zinc-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {feedbackMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {mySubs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
          <p className="text-sm font-bold text-white">No submissions in this filter</p>
          <Link href="/campaigns" className="mt-2 inline-block text-xs text-tally-bright">
            Browse Open Campaigns &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {mySubs.map((sub) => {
            const camp = db.campaigns.find((c) => c.id === sub.campaign_id);
            const snapshots = db.view_snapshots.filter((sn) => sn.submission_id === sub.id);
            const subDisputes = db.disputes.filter((d) => d.submission_id === sub.id);
            const postSla = getPostDeadlineStatus(sub);

            return (
              <div
                key={sub.id}
                className="grid grid-cols-1 gap-6 rounded-2xl border border-white/10 bg-surface p-5 lg:grid-cols-12"
              >
                {/* Left 4 cols: Protected 9:16 Preview */}
                <div className="lg:col-span-4">
                  <ProtectedVideoPlayer
                    submission={sub}
                    editorUsername={currentUser.username}
                    currency={camp?.currency || 'USD'}
                    compact
                  />
                </div>

                {/* Right 8 cols: Status, Notes, Post URL, View Snapshots & Dispute Trigger */}
                <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <SubmissionStatusChip status={sub.status} />
                      <span className="font-mono text-xs text-zinc-400">
                        Submitted {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/campaigns/${sub.campaign_id}`}
                        className="text-lg font-bold text-white hover:text-tally-bright"
                      >
                        {camp?.title}
                      </Link>
                      <p className="font-mono text-xs text-zinc-400">
                        File: {sub.file_name} · Caption: &ldquo;{sub.suggested_caption || 'N/A'}&rdquo;
                      </p>
                    </div>

                    {/* Revision Note & Resubmit Trigger */}
                    {sub.revision_note && (
                      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          Revision Note from Account Holder
                        </span>
                        <p className="text-xs text-amber-100">&ldquo;{sub.revision_note}&rdquo;</p>
                        {sub.status === 'revision_requested' && (
                          <button
                            type="button"
                            onClick={() =>
                              setResubmitTargetId(resubmitTargetId === sub.id ? null : sub.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-zinc-950"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Resubmit Revised Clip
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline Resubmit Form */}
                    {resubmitTargetId === sub.id && (
                      <form
                        onSubmit={(e) => handleResubmit(e, sub.id, sub.campaign_id)}
                        className="rounded-xl border border-tally/40 bg-elevated p-4 space-y-3"
                      >
                        <h4 className="text-xs font-bold uppercase text-tally-bright">
                          Upload or Link Revised V2 Clip
                        </h4>
                        <input
                          type="url"
                          value={resubmitLink}
                          onChange={(e) => setResubmitLink(e.target.value)}
                          placeholder="Optional Drive/Dropbox URL (leave blank to upload revised MP4 to private bucket)"
                          className="w-full rounded-lg border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          required
                          value={resubmitNotes}
                          onChange={(e) => setResubmitNotes(e.target.value)}
                          placeholder="What did you change in this revision? (e.g. Trimmed 1.8s intro breath)"
                          className="w-full rounded-lg border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-tally px-4 py-2 text-xs font-bold text-zinc-950"
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          Send Resubmission
                        </button>
                      </form>
                    )}

                    {/* Rejection Reason */}
                    {sub.status === 'rejected' && sub.rejection_reason && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200">
                        <span className="font-bold">Rejection Reason:</span> {sub.rejection_reason}
                      </div>
                    )}

                    {/* Selected / Posted 72h Deadline & Live Post URL */}
                    {['selected', 'posted', 'paid'].includes(sub.status) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-white/10 bg-elevated p-3.5 text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-zinc-400">72h Post SLA</span>
                          <p
                            className={`mt-0.5 font-mono font-bold ${
                              postSla.state === 'overdue'
                                ? 'text-red-400'
                                : 'text-emerald-300'
                            }`}
                          >
                            {postSla.label}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-zinc-400">
                            Counted Views
                          </span>
                          <p className="mt-0.5 font-mono text-sm font-extrabold text-white">
                            {sub.counted_views.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-zinc-400">
                            Accrued Earnings
                          </span>
                          <p className="mt-0.5 font-mono text-sm font-extrabold text-tally-bright">
                            {formatMoneyCents(sub.net_earnings_cents, camp?.currency || 'USD')}
                          </p>
                        </div>
                      </div>
                    )}

                    {sub.posted_url && (
                      <div className="flex items-center justify-between rounded-xl border border-tally/30 bg-tally/10 px-3.5 py-2.5 text-xs">
                        <span className="font-mono text-zinc-200 truncate max-w-[75%]">
                          Live Post: {sub.posted_url}
                        </span>
                        <a
                          href={sub.posted_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-tally-bright hover:underline"
                        >
                          Verify Live <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}

                    {/* View Snapshots History + Dispute Trigger */}
                    {snapshots.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Verified View Snapshots ({snapshots.length})
                        </h4>
                        <div className="space-y-2">
                          {snapshots.map((snap) => (
                            <div
                              key={snap.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-white">
                                  {snap.views.toLocaleString()} views
                                </span>{' '}
                                <span className="text-zinc-400">
                                  ({snap.source} · {new Date(snap.created_at).toLocaleDateString()})
                                </span>
                                {snap.note && (
                                  <p className="text-[11px] text-zinc-400">{snap.note}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={snap.proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
                                >
                                  Screenshot Proof <ExternalLink className="h-3 w-3" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDisputeTargetSnapshotId(snap.id);
                                    setDisputeSubmissionId(sub.id);
                                    setDisputeClaimedViews(snap.views + 10000);
                                  }}
                                  className="inline-flex items-center gap-1 rounded border border-red-500/35 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
                                >
                                  <Flag className="h-3 w-3" />
                                  Dispute Snapshot
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active or Resolved Disputes on this Submission */}
                    {subDisputes.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-xl border border-white/10 bg-elevated p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-white">
                            Dispute on Snapshot {d.snapshot_id} (Claimed:{' '}
                            {d.claimed_views.toLocaleString()} views)
                          </span>
                          <DisputeStatusChip status={d.status} />
                        </div>
                        <p className="text-zinc-300">Reason: {d.reason}</p>
                        {d.resolution_note && (
                          <p className="text-emerald-300 font-medium">
                            Admin Resolution: {d.resolution_note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Open Dispute Modal */}
      {disputeTargetSnapshotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleOpenDisputeSubmit}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-elevated p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Open View Snapshot Dispute ({disputeTargetSnapshotId})
              </h3>
              <button
                type="button"
                onClick={() => setDisputeTargetSnapshotId(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Actual Views Shown on Live Post
              </label>
              <input
                type="number"
                required
                min={0}
                value={disputeClaimedViews}
                onChange={(e) => setDisputeClaimedViews(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Discrepancy Explanation (min 10 chars)
              </label>
              <textarea
                required
                minLength={10}
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain what the live TikTok/Reels view counter shows compared to the reported snapshot..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-inset p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Screenshot Proof URL
              </label>
              <input
                type="url"
                value={disputeEvidenceUrl}
                onChange={(e) => setDisputeEvidenceUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white hover:bg-red-400"
            >
              Submit Dispute to Admin Review
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
