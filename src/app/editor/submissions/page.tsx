'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowsClockwise,
  ArrowSquareOut,
  CheckCircle,
  Flag,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { SubmissionStatusChip } from '@/components/StatusChip';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';
import { ClappyMascot } from '@/components/ClappyMascot';

export default function EditorSubmissionsPage() {
  const { db, currentUser, resubmitClip, openViewDispute } = useWhap();

  const editorId = currentUser?.id || 'editor-1';
  const mySubmissions = db.submissions.filter((s) => s.editor_id === editorId);

  const [resubmitNotesMap, setResubmitNotesMap] = useState<Record<string, string>>(
    {}
  );
  const [disputeSnapId, setDisputeSnapId] = useState<string | null>(null);
  const [claimedViews, setClaimedViews] = useState<number>(26500);
  const [disputeReason, setDisputeReason] = useState<string>(
    'Live TikTok page shows 26.5K views right now.'
  );
  const [disputeProofUrl, setDisputeProofUrl] = useState<string>(
    'https://storage.whap.app/proofs/editor-live-count.png'
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResubmit = (submissionId: string, oldFileName: string) => {
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const cleanBase = oldFileName.replace(/\.mp4$/i, '');
      resubmitClip({
        submission_id: submissionId,
        file_name: `${cleanBase}-v2.mp4`,
        notes:
          resubmitNotesMap[submissionId] ||
          'Updated first 2 seconds and tightened the audio transitions.',
      });
      setToastMsg('Updated cut sent! The page owner was notified.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleOpenDispute = (submissionId: string, snapshotId: string) => {
    setErrorMsg(null);
    setToastMsg(null);
    try {
      openViewDispute({
        submission_id: submissionId,
        snapshot_id: snapshotId,
        claimed_views: Number(claimedViews),
        reason: disputeReason,
        evidence_url: disputeProofUrl,
      });
      setDisputeSnapId(null);
      setToastMsg('Dispute opened. An admin will check your screenshot.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">
            My Submitted Clips
          </h1>
          <p className="mt-1 text-sm text-muted">
            Every clip shows its status chip, post link, and view snapshots.
          </p>
        </div>
        <Link href="/campaigns" className="btn-sticker btn-primary text-xs">
          <UploadSimple weight="bold" className="h-4 w-4" />
          <span>Submit Another Clip</span>
        </Link>
      </div>

      {toastMsg && (
        <div className="flex items-center gap-2.5 rounded-btn border-2 border-ink bg-sprout p-4 text-sm font-extrabold text-ink shadow-btn">
          <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-btn border-2 border-ink bg-coral p-4 text-sm font-extrabold text-ink shadow-btn">
          <WarningCircle weight="bold" className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {mySubmissions.length === 0 ? (
        <div className="card-sticker bg-mint p-10 flex flex-col items-center justify-center text-center space-y-3">
          <ClappyMascot variant="empty" size={96} />
          <h2 className="font-display text-2xl text-ink">No clips sent yet</h2>
          <p className="max-w-sm text-sm text-muted">
            Pick an open campaign and send your first vertical cut in under 2
            minutes.
          </p>
          <Link href="/campaigns" className="btn-sticker btn-primary">
            <span>Browse Campaigns</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {mySubmissions.map((sub) => {
            const camp = db.campaigns.find((c) => c.id === sub.campaign_id);
            const snapshots = db.view_snapshots.filter(
              (v) => v.submission_id === sub.id
            );

            return (
              <div
                key={sub.id}
                className="card-sticker p-6 grid grid-cols-1 gap-6 lg:grid-cols-12"
              >
                {/* Left 4 Cols: Video Preview */}
                <div className="lg:col-span-4">
                  <ProtectedVideoPlayer
                    submissionId={sub.id}
                    editorUsername={currentUser?.username || 'kenjicuts'}
                    status={sub.status}
                    fileName={sub.file_name}
                    durationSec={sub.duration_sec}
                    previewVideoUrl={sub.preview_video_url}
                    externalLink={sub.external_link}
                    aspectRatio={camp?.aspect_ratio || '9:16'}
                  />
                </div>

                {/* Right 8 Cols: Status, Feedback, Post Link & View Snapshots */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                    <div>
                      <Link
                        href={`/campaigns/${sub.campaign_id}`}
                        className="text-xs font-extrabold uppercase text-forest hover:underline"
                      >
                        {camp?.title}
                      </Link>
                      <h2 className="font-display text-2xl text-ink">
                        {sub.file_name}
                      </h2>
                    </div>
                    <SubmissionStatusChip status={sub.status} />
                  </div>

                  {/* Earnings + Locked Rate Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-btn border-2 border-ink bg-mint p-3">
                      <span className="text-xs font-bold text-muted">
                        Counted Views
                      </span>
                      <p className="font-display text-xl text-ink tabular-nums">
                        {sub.counted_views.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-btn border-2 border-ink bg-mint p-3">
                      <span className="text-xs font-bold text-muted">
                        Locked Rate / 1K
                      </span>
                      <p className="font-display text-xl text-ink tabular-nums">
                        {formatMoneyCents(
                          sub.locked_rate_per_1k_cents ??
                            camp?.rate_per_1k_cents ??
                            0,
                          camp?.currency || 'USD'
                        )}
                      </p>
                    </div>
                    <div className="rounded-btn border-2 border-ink bg-sprout p-3">
                      <span className="text-xs font-extrabold text-ink">
                        Clip Earnings
                      </span>
                      <p className="font-display text-xl text-ink tabular-nums">
                        {formatMoneyCents(
                          sub.net_earnings_cents,
                          camp?.currency || 'USD'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Revision Request Box */}
                  {sub.status === 'revision_requested' && (
                    <div className="rounded-card border-2 border-ink bg-sun p-4 space-y-3 shadow-btn">
                      <span className="block text-xs font-extrabold uppercase text-ink">
                        Changes Requested by Page Owner
                      </span>
                      <p className="text-sm font-bold text-ink">
                        &ldquo;{sub.revision_note}&rdquo;
                      </p>
                      <div className="space-y-2 pt-1">
                        <label
                          htmlFor={`resubmit-note-${sub.id}`}
                          className="block text-xs font-extrabold text-ink"
                        >
                          What did you update in the new cut?
                        </label>
                        <input
                          id={`resubmit-note-${sub.id}`}
                          type="text"
                          value={
                            resubmitNotesMap[sub.id] ??
                            'Moved headline hook to 0:00.5 and boosted voice level.'
                          }
                          onChange={(e) =>
                            setResubmitNotesMap((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          className="input-sticker"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleResubmit(
                              sub.id,
                              sub.file_name || 'clip-upload.mp4'
                            )
                          }
                          className="btn-sticker btn-primary text-xs"
                        >
                          <ArrowsClockwise weight="bold" className="h-4 w-4" />
                          <span>Upload &amp; Send Updated Cut</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason Box */}
                  {sub.status === 'rejected' && sub.rejection_reason && (
                    <div className="rounded-btn border-2 border-ink bg-coral p-4 text-sm font-bold text-ink">
                      <strong>Reason not picked:</strong> {sub.rejection_reason}
                    </div>
                  )}

                  {/* Posted URL */}
                  {sub.posted_url && (
                    <div className="rounded-btn border-2 border-ink bg-mint p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-extrabold text-ink">
                        Posted live at:{' '}
                        <a
                          href={sub.posted_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-forest underline"
                        >
                          {sub.posted_url}
                        </a>
                      </span>
                      <a
                        href={sub.posted_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-extrabold text-forest"
                      >
                        <span>Open Post</span>
                        <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}

                  {/* View Snapshots History + Dispute Trigger */}
                  {snapshots.length > 0 && (
                    <div className="space-y-2.5 border-t-2 border-ink pt-3">
                      <h3 className="text-xs font-extrabold uppercase text-ink">
                        Verified View Snapshots ({snapshots.length})
                      </h3>
                      <div className="space-y-2">
                        {snapshots.map((snap) => (
                          <div
                            key={snap.id}
                            className="rounded-btn border-2 border-ink bg-paper p-3 text-xs space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="space-x-2">
                                <span className="font-extrabold text-ink tabular-nums">
                                  {snap.views.toLocaleString()} views
                                </span>
                                <span className="text-muted font-bold">
                                  ({new Date(snap.created_at).toLocaleDateString()} ·{' '}
                                  {snap.source})
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <a
                                  href={snap.proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-extrabold text-forest underline"
                                >
                                  Screenshot Proof
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDisputeSnapId(
                                      disputeSnapId === snap.id ? null : snap.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 font-extrabold text-ink"
                                >
                                  <Flag weight="bold" className="h-3 w-3" />
                                  <span>Dispute Count</span>
                                </button>
                              </div>
                            </div>

                            {disputeSnapId === snap.id && (
                              <div className="rounded-btn border-2 border-ink bg-mint p-3 space-y-3 mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label
                                      htmlFor={`disp-views-${snap.id}`}
                                      className="mb-1 block text-xs font-extrabold text-ink"
                                    >
                                      Actual view count on the post
                                    </label>
                                    <input
                                      id={`disp-views-${snap.id}`}
                                      type="number"
                                      value={claimedViews}
                                      onChange={(e) =>
                                        setClaimedViews(Number(e.target.value))
                                      }
                                      className="input-sticker tabular-nums"
                                    />
                                  </div>
                                  <div>
                                    <label
                                      htmlFor={`disp-proof-${snap.id}`}
                                      className="mb-1 block text-xs font-extrabold text-ink"
                                    >
                                      Your screenshot link
                                    </label>
                                    <input
                                      id={`disp-proof-${snap.id}`}
                                      type="url"
                                      value={disputeProofUrl}
                                      onChange={(e) =>
                                        setDisputeProofUrl(e.target.value)
                                      }
                                      className="input-sticker"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label
                                    htmlFor={`disp-reason-${snap.id}`}
                                    className="mb-1 block text-xs font-extrabold text-ink"
                                  >
                                    What looks wrong with this snapshot?
                                  </label>
                                  <input
                                    id={`disp-reason-${snap.id}`}
                                    type="text"
                                    value={disputeReason}
                                    onChange={(e) =>
                                      setDisputeReason(e.target.value)
                                    }
                                    className="input-sticker"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDispute(sub.id, snap.id)}
                                  className="btn-sticker btn-primary py-2 px-4 text-xs"
                                >
                                  <span>Send Dispute to Admin</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
