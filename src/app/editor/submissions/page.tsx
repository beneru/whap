'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowsClockwise,
  ArrowSquareOut,
  Check,
  CheckCircle,
  Copy,
  FileText,
  Flag,
  Lock,
  ShieldCheck,
  UploadSimple,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { SubmissionStatusChip } from '@/components/StatusChip';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';
import { ClappyMascot } from '@/components/ClappyMascot';
import { Campaign, PlatformId, Submission } from '@/lib/types';

export default function EditorSubmissionsPage() {
  const { db, currentUser, resubmitClip, openViewDispute, submitPostUrl } = useWhap();

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

  // Editor-initiated Live Post URL submission state
  const [editorPostModalSubId, setEditorPostModalSubId] = useState<string | null>(null);
  const [editorPostUrl, setEditorPostUrl] = useState('');
  const [editorPostPlatform, setEditorPostPlatform] = useState<PlatformId>('tiktok');
  const [editorPostViews, setEditorPostViews] = useState(5000);
  const [editorPostProofUrl, setEditorPostProofUrl] = useState(
    'https://storage.whap.app/proofs/editor-spotted-post.png'
  );
  const [submittingPostUrl, setSubmittingPostUrl] = useState(false);

  // DMCA & Digital Rights modal state
  const [dmcaModalSubId, setDmcaModalSubId] = useState<string | null>(null);
  const [copiedDmca, setCopiedDmca] = useState(false);

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

  const handleEditorSubmitPostUrl = async (submissionId: string) => {
    setErrorMsg(null);
    setToastMsg(null);
    setSubmittingPostUrl(true);
    try {
      if (!editorPostUrl.trim()) {
        throw new Error('Please enter the live post URL.');
      }
      await submitPostUrl({
        submission_id: submissionId,
        posted_url: editorPostUrl.trim(),
        posted_platform: editorPostPlatform,
        initial_views: Number(editorPostViews),
        proof_url:
          editorPostProofUrl.trim() ||
          'https://storage.whap.app/proofs/editor-spotted-post.png',
        submitted_by: 'editor',
      });
      setEditorPostModalSubId(null);
      setToastMsg(
        'Live post URL recorded! View tracking and escrow accrual have begun.'
      );
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmittingPostUrl(false);
    }
  };

  const generateDmcaNotice = (sub: Submission, camp?: Campaign) => {
    const editorName =
      currentUser?.display_name || currentUser?.username || 'Editor';
    const editorEmail = currentUser?.email || 'editor@example.com';
    const targetHandle = camp?.target_page_handles.join(', ') || '@page';
    const postUrl =
      sub.posted_url || 'https://tiktok.com/@page/video/123456789';
    const dateStr = new Date().toISOString().slice(0, 10);

    return `DMCA COPYRIGHT INFRINGEMENT NOTICE

To: Copyright Agent
Platform: ${sub.posted_platform ? sub.posted_platform.toUpperCase() : 'Social Network'}

I am the original creator, video editor, and copyright owner of the audiovisual work published without authorization at the URL below.

Infringing URL:
${postUrl}

Original Work Description:
Title: ${sub.file_name}
Marketplace Reference ID: ${sub.id}
Campaign: ${camp?.title || 'Clipping Campaign'}
Creation Date: ${sub.selected_at ? new Date(sub.selected_at).toISOString().slice(0, 10) : dateStr}

Legal Basis:
The page owner (${targetHandle}) was granted a conditional digital license via the whap marketplace requiring timely settlement of view-based compensation. Because the page owner has defaulted on payment obligations or violated license terms, this usage is unauthorized.

Statutory Declarations:
1. I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
2. The information in this notification is accurate, and under penalty of perjury, I am the owner of an exclusive right that is allegedly infringed.

Copyright Owner:
Name: ${editorName}
Email: ${editorEmail}
Date: ${dateStr}
Digital Signature: /s/ ${editorName}`;
  };

  const handleCopyDmca = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedDmca(true);
      setTimeout(() => setCopiedDmca(false), 2500);
    } catch {
      // ignore
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
            Every clip shows guaranteed base fees, locked escrow reserves, and view snapshots.
          </p>
        </div>
        <Link href="/campaigns" className="btn-sticker btn-primary text-xs">
          <UploadSimple weight="bold" className="h-4 w-4" />
          <span>Submit Another Clip</span>
        </Link>
      </div>

      {toastMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-sprout/20 p-4 text-sm font-semibold text-ink shadow-sm">
          <CheckCircle weight="bold" className="h-5 w-5 shrink-0 text-forest" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-coral/40 bg-coral/15 p-4 text-sm font-semibold text-ink shadow-sm">
          <WarningCircle weight="bold" className="h-5 w-5 shrink-0 text-coral" />
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
            const isSelected = sub.status === 'selected';
            const isPosted = sub.status === 'posted';
            const isPaid = sub.status === 'paid';

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

                {/* Right 8 Cols: Status, Payment Security, Post Link & View Snapshots */}
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
                    <div className="flex items-center gap-2">
                      <SubmissionStatusChip status={sub.status} />
                      {(isSelected || isPosted || isPaid) && (
                        <button
                          type="button"
                          onClick={() => {
                            setDmcaModalSubId(sub.id);
                            setCopiedDmca(false);
                          }}
                          className="btn-sticker btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                          title="View Digital Copyright License & DMCA Notice"
                        >
                          <ShieldCheck weight="bold" className="h-4 w-4 text-forest" />
                          <span>License &amp; DMCA</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Payment Protection Badges */}
                  {(isSelected || isPosted || isPaid) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-sprout/25 px-3 py-1 text-xs font-bold text-ink">
                        <CheckCircle weight="bold" className="h-3.5 w-3.5 text-forest" />
                        <span>
                          Guaranteed Base Fee Paid (
                          {formatMoneyCents(
                            sub.locked_base_fee_cents ?? camp?.base_fee_cents ?? 0,
                            camp?.currency || 'USD'
                          )}
                          )
                        </span>
                      </span>

                      {sub.locked_max_payout_cents && sub.locked_max_payout_cents > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sun/60 bg-sun/20 px-3 py-1 text-xs font-bold text-ink">
                          <Lock weight="bold" className="h-3.5 w-3.5 text-ink" />
                          <span>
                            Escrow Reserve Held (up to{' '}
                            {formatMoneyCents(
                              sub.locked_max_payout_cents,
                              camp?.currency || 'USD'
                            )}
                            )
                          </span>
                        </span>
                      )}

                      {sub.missed_post_deadline && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-coral/50 bg-coral/20 px-3 py-1 text-xs font-bold text-coral">
                          <WarningCircle weight="bold" className="h-3.5 w-3.5" />
                          <span>Rights Reverted (Deadline Missed)</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Earnings + Locked Rate Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-mint/50 p-3">
                      <span className="text-xs font-medium text-muted">
                        Counted Views
                      </span>
                      <p className="font-display text-xl font-bold text-ink tabular-nums">
                        {sub.counted_views.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-mint/50 p-3">
                      <span className="text-xs font-medium text-muted">
                        Locked Rate / 1K
                      </span>
                      <p className="font-display text-xl font-bold text-ink tabular-nums">
                        {formatMoneyCents(
                          sub.locked_rate_per_1k_cents ??
                            camp?.rate_per_1k_cents ??
                            0,
                          camp?.currency || 'USD'
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/30 bg-sprout/20 p-3">
                      <span className="text-xs font-bold text-forest">
                        Clip Earnings
                      </span>
                      <p className="font-display text-xl font-bold text-ink tabular-nums">
                        {formatMoneyCents(
                          sub.net_earnings_cents,
                          camp?.currency || 'USD'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Selected but Not Yet Posted: Anti-Evasion Trigger */}
                  {isSelected && !sub.posted_url && (
                    <div className="rounded-xl border border-sun/60 bg-sun/15 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="chip-sticker bg-sprout text-ink">
                            Guaranteed Base Fee Secured
                          </span>
                          <h4 className="font-display text-base text-ink">
                            Did the page owner post this clip on social media?
                          </h4>
                          <p className="text-xs text-muted">
                            Your base fee is already credited. If you spot your clip live on their page, submit the post URL here to force view tracking and escrow accrual.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditorPostModalSubId(sub.id);
                            setEditorPostUrl('');
                            setEditorPostPlatform(camp?.platforms[0] || 'tiktok');
                          }}
                          className="btn-sticker btn-primary text-xs shrink-0 inline-flex items-center gap-1.5"
                        >
                          <ArrowSquareOut weight="bold" className="h-4 w-4" />
                          <span>Submit Live Post URL</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 72h Missed Deadline Alert */}
                  {sub.missed_post_deadline && (
                    <div className="rounded-xl border border-coral/50 bg-coral/15 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-ink font-bold">
                        <WarningCircle weight="bold" className="h-5 w-5 text-coral shrink-0" />
                        <span>72h Posting Deadline Missed by Page Owner</span>
                      </div>
                      <p className="text-xs text-ink leading-relaxed">
                        The page owner missed the 72-hour posting deadline. All copyright and distribution rights have reverted back to you. You are free to submit this clip to other campaigns or sell it elsewhere.
                        {sub.kill_fee_paid_cents
                          ? ` A kill fee of ${formatMoneyCents(
                              sub.kill_fee_paid_cents,
                              camp?.currency || 'USD'
                            )} has been secured in your wallet.`
                          : ''}
                      </p>
                    </div>
                  )}

                  {/* Revision Request Box */}
                  {sub.status === 'revision_requested' && (
                    <div className="rounded-xl border border-sun/50 bg-sun/20 p-4 space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-ink">
                        Changes Requested by Page Owner
                      </span>
                      <p className="text-sm font-semibold text-ink">
                        &ldquo;{sub.revision_note}&rdquo;
                      </p>
                      <div className="space-y-2 pt-1">
                        <label
                          htmlFor={`resubmit-note-${sub.id}`}
                          className="block text-xs font-bold text-ink"
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
                    <div className="rounded-xl border border-coral/40 bg-coral/15 p-4 text-sm font-medium text-ink">
                      <strong className="font-bold">Reason not picked:</strong> {sub.rejection_reason}
                    </div>
                  )}

                  {/* Posted URL */}
                  {sub.posted_url && (
                    <div className="rounded-xl border border-border bg-mint/50 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
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
                        {sub.posted_by === 'editor' && (
                          <span className="block text-[11px] font-bold text-muted">
                            Submitted by you (Editor) to initiate view tracking
                          </span>
                        )}
                      </div>
                      <a
                        href={sub.posted_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-extrabold text-forest hover:underline"
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
                            className="rounded-xl border border-border bg-paper p-3 text-xs space-y-2 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="space-x-2">
                                <span className="font-bold text-ink tabular-nums">
                                  {snap.views.toLocaleString()} views
                                </span>
                                <span className="text-muted font-medium">
                                  ({new Date(snap.created_at).toLocaleDateString()} ·{' '}
                                  {snap.source})
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <a
                                  href={snap.proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-forest underline hover:text-emerald-700"
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
                                  className="inline-flex items-center gap-1 rounded-full border border-sun/60 bg-sun/30 px-2.5 py-0.5 font-bold text-ink hover:bg-sun/50 transition"
                                >
                                  <Flag weight="bold" className="h-3 w-3" />
                                  <span>Dispute Count</span>
                                </button>
                              </div>
                            </div>

                            {disputeSnapId === snap.id && (
                              <div className="rounded-xl border border-border bg-mint/50 p-3 space-y-3 mt-2">
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

      {/* Editor Post URL Submission Modal */}
      {editorPostModalSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="card-sticker max-w-lg w-full bg-paper p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <div>
                <span className="chip-sticker bg-sprout text-ink">
                  Anti-Evasion Detection
                </span>
                <h3 className="font-display text-xl text-ink mt-1">
                  Submit Live Post URL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditorPostModalSubId(null)}
                className="text-muted hover:text-ink p-1"
              >
                <X weight="bold" className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              If the page owner published your clip without submitting the link, paste the live URL below. The platform will record the link, start view tracking, and accrue earnings from campaign escrow.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  Platform
                </label>
                <select
                  value={editorPostPlatform}
                  onChange={(e) => setEditorPostPlatform(e.target.value as PlatformId)}
                  className="input-sticker text-xs"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="ig_reels">Instagram Reels</option>
                  <option value="youtube_shorts">YouTube Shorts</option>
                  <option value="fb_reels">Facebook Reels</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  Live Post URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.tiktok.com/@page/video/..."
                  value={editorPostUrl}
                  onChange={(e) => setEditorPostUrl(e.target.value)}
                  className="input-sticker text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Current Verified Views
                  </label>
                  <input
                    type="number"
                    value={editorPostViews}
                    onChange={(e) => setEditorPostViews(Number(e.target.value))}
                    className="input-sticker text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-ink">
                    Screenshot Proof Link
                  </label>
                  <input
                    type="url"
                    value={editorPostProofUrl}
                    onChange={(e) => setEditorPostProofUrl(e.target.value)}
                    className="input-sticker text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditorPostModalSubId(null)}
                className="btn-sticker btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingPostUrl}
                onClick={() => handleEditorSubmitPostUrl(editorPostModalSubId)}
                className="btn-sticker btn-primary text-xs"
              >
                <span>{submittingPostUrl ? 'Submitting...' : 'Confirm & Force View Tracking'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital License & DMCA Notice Modal */}
      {dmcaModalSubId && (() => {
        const sub = mySubmissions.find((s) => s.id === dmcaModalSubId);
        if (!sub) return null;
        const camp = db.campaigns.find((c) => c.id === sub.campaign_id);
        const noticeText = generateDmcaNotice(sub, camp);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
            <div className="card-sticker max-w-xl w-full bg-paper p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck weight="bold" className="h-6 w-6 text-forest" />
                  <div>
                    <h3 className="font-display text-xl text-ink">
                      Digital Copyright &amp; DMCA Shield
                    </h3>
                    <p className="text-xs text-muted">
                      Legal rights protection for {sub.file_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDmcaModalSubId(null)}
                  className="text-muted hover:text-ink p-1"
                >
                  <X weight="bold" className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-sprout/20 p-3.5 space-y-1 text-xs">
                <span className="font-extrabold text-ink block">
                  Conditional License Agreement Terms
                </span>
                <p className="text-muted leading-relaxed">
                  Rights to this video are granted on a conditional basis. Full commercial usage rights transfer to the page owner only upon settlement of all accrued view earnings. If the page owner defaults, withholds views, or fails to pay, the license is revoked immediately.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink">
                    Generated DMCA Takedown Notice
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyDmca(noticeText)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline"
                  >
                    {copiedDmca ? (
                      <>
                        <Check weight="bold" className="h-3.5 w-3.5" />
                        <span>Copied Notice!</span>
                      </>
                    ) : (
                      <>
                        <Copy weight="bold" className="h-3.5 w-3.5" />
                        <span>Copy Notice</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={10}
                  value={noticeText}
                  className="input-sticker text-[11px] font-mono leading-relaxed"
                />
              </div>

              <p className="text-[11px] text-muted">
                Send this notice directly to the platform copyright agent (e.g. legal@tiktok.com, dmca@instagram.com, or copyright@youtube.com) if the page owner refuses payment.
              </p>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDmcaModalSubId(null)}
                  className="btn-sticker btn-primary text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
