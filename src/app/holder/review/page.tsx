'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Broadcast,
  CheckCircle,
  NotePencil,
  XCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { SubmissionStatusChip } from '@/components/StatusChip';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';
import { ClappyMascot, ConfettiBurst } from '@/components/ClappyMascot';

/**
 * Review Queue Screen:
 * One clip per screen, video on top, three big buttons in the thumb zone:
 * Select (sprout), Revise (sun), Reject (coral).
 * Small confetti burst on "clip selected".
 */
export default function ReviewQueuePage() {
  const { db, reviewSubmission } = useWhap();

  const queue = db.submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'resubmitted'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbackNote, setFeedbackNote] = useState(
    'Move the headline caption up slightly and trim 1 second from the intro.'
  );
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedConfetti, setSelectedConfetti] = useState(false);

  const safeIndex =
    queue.length > 0 ? Math.min(currentIndex, queue.length - 1) : 0;
  const currentClip = queue[safeIndex];

  const handleAction = (
    action: 'select' | 'request_revision' | 'reject'
  ) => {
    if (!currentClip) return;
    setErrorMsg(null);
    setBannerMsg(null);

    try {
      reviewSubmission({
        submission_id: currentClip.id,
        action,
        note: action === 'select' ? undefined : feedbackNote,
      });

      if (action === 'select') {
        setSelectedConfetti(false);
        setTimeout(() => setSelectedConfetti(true), 20);
        setBannerMsg(
          'Your clip got picked! Clean file is now ready to download and rate is locked.'
        );
      } else if (action === 'request_revision') {
        setBannerMsg('Revision note sent to the editor.');
      } else {
        setBannerMsg('Clip marked as rejected.');
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">
            Submission Review Queue
          </h1>
          <p className="mt-1 text-sm text-muted">
            One clip at a time. Video on top, three big decision buttons in the
            thumb zone.
          </p>
        </div>

        {queue.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safeIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="btn-sticker btn-secondary py-2 px-3 text-xs min-h-[44px]"
            >
              <ArrowLeft weight="bold" className="h-4 w-4" />
              <span>Prev</span>
            </button>
            <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-extrabold text-ink tabular-nums">
              {safeIndex + 1} / {queue.length}
            </span>
            <button
              type="button"
              disabled={safeIndex >= queue.length - 1}
              onClick={() =>
                setCurrentIndex((i) => Math.min(queue.length - 1, i + 1))
              }
              className="btn-sticker btn-secondary py-2 px-3 text-xs min-h-[44px]"
            >
              <span>Next</span>
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {bannerMsg && (
        <div className="card-sticker bg-sprout p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-extrabold text-ink">
            <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
            <span>{bannerMsg}</span>
            <ConfettiBurst active={selectedConfetti} />
          </div>
          <Link
            href="/holder/posted"
            className="btn-sticker btn-secondary py-1.5 px-3 text-xs min-h-[38px]"
          >
            <Broadcast weight="bold" className="h-4 w-4" />
            <span>Go to Posted Clips</span>
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-btn border-2 border-ink bg-coral p-4 text-sm font-extrabold text-ink shadow-btn">
          {errorMsg}
        </div>
      )}

      {!currentClip ? (
        <div className="card-sticker bg-mint p-10 flex flex-col items-center justify-center text-center space-y-4">
          <ClappyMascot variant="celebrate" size={104} />
          <h2 className="font-display text-2xl text-ink">
            All caught up! Zero clips waiting.
          </h2>
          <p className="max-w-md text-sm text-muted">
            You reviewed every submitted clip. Head over to Posted Clips to paste
            live links or log weekly view counts.
          </p>
          <Link href="/holder/posted" className="btn-sticker btn-primary">
            <Broadcast weight="bold" className="h-5 w-5" />
            <span>Open Posted Clips</span>
          </Link>
        </div>
      ) : (
        (() => {
          const camp = db.campaigns.find(
            (c) => c.id === currentClip.campaign_id
          );
          const editor = db.profiles.find(
            (p) => p.id === currentClip.editor_id
          );

          return (
            <div className="card-sticker p-5 sm:p-6 space-y-5">
              {/* Top Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                <div>
                  <span className="text-xs font-extrabold uppercase text-forest">
                    {camp?.title}
                  </span>
                  <h2 className="font-display text-2xl text-ink">
                    {currentClip.file_name} · by @{editor?.username}
                  </h2>
                </div>
                <SubmissionStatusChip status={currentClip.status} />
              </div>

              {/* 1. Video On Top (Watermarked Streamed Preview) */}
              <ProtectedVideoPlayer
                submissionId={currentClip.id}
                editorUsername={editor?.username || 'editor'}
                status={currentClip.status}
                fileName={currentClip.file_name}
                durationSec={currentClip.duration_sec}
                previewVideoUrl={currentClip.preview_video_url}
                externalLink={currentClip.external_link}
                aspectRatio={camp?.aspect_ratio || '9:16'}
              />

              {/* Clip Metadata & Rate Lock Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-btn border-2 border-ink bg-mint p-3">
                  <span className="font-bold text-muted">Rate if picked</span>
                  <p className="mt-0.5 font-display text-xl text-ink tabular-nums">
                    {formatMoneyCents(
                      camp?.rate_per_1k_cents || 0,
                      camp?.currency || 'USD'
                    )}{' '}
                    / 1K
                  </p>
                </div>
                <div className="rounded-btn border-2 border-ink bg-mint p-3">
                  <span className="font-bold text-muted">Base fee on pick</span>
                  <p className="mt-0.5 font-display text-xl text-ink tabular-nums">
                    {formatMoneyCents(
                      camp?.base_fee_cents || 0,
                      camp?.currency || 'USD'
                    )}
                  </p>
                </div>
                <div className="rounded-btn border-2 border-ink bg-mint p-3">
                  <span className="font-bold text-muted">Posting SLA</span>
                  <p className="mt-0.5 font-display text-xl text-ink tabular-nums">
                    {camp?.post_deadline_hours || 72} hours
                  </p>
                </div>
              </div>

              {currentClip.notes && (
                <div className="rounded-btn border-2 border-ink bg-mint p-3.5 text-xs">
                  <span className="font-extrabold text-ink">Editor note: </span>
                  <span className="text-ink">{currentClip.notes}</span>
                </div>
              )}

              {/* Revision / Reject Note Input (Visible Label Above Field) */}
              <div>
                <label
                  htmlFor="review-note-input"
                  className="mb-1.5 block text-sm font-extrabold text-ink"
                >
                  Note for the editor (required if asking for changes or rejecting)
                </label>
                <input
                  id="review-note-input"
                  type="text"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  className="input-sticker"
                />
              </div>

              {/* Three Big Buttons in the Thumb Zone: Select (sprout), Revise (sun), Reject (coral) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleAction('select')}
                  className="btn-sticker btn-primary w-full text-base py-3.5"
                >
                  <CheckCircle weight="bold" className="h-5 w-5" />
                  <span>Select</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('request_revision')}
                  className="btn-sticker btn-sun w-full text-base py-3.5"
                >
                  <NotePencil weight="bold" className="h-5 w-5" />
                  <span>Revise</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('reject')}
                  className="btn-sticker btn-danger w-full text-base py-3.5"
                >
                  <XCircle weight="bold" className="h-5 w-5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
