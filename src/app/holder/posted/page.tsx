'use client';

import React, { useState } from 'react';
import {
  ArrowSquareOut,
  Broadcast,
  CheckCircle,
  Clock,
  PlusCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import {
  formatMoneyCents,
  getPostDeadlineStatus,
  getViewUpdateReminderStatus,
} from '@/lib/payout-math';
import { SubmissionStatusChip } from '@/components/StatusChip';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';

export default function PostedClipsAndViewsPage() {
  const {
    db,
    submitPostUrlForClip,
    recordManualViewSnapshot,
    triggerMissedDeadlineCheck,
  } = useWhap();

  const activeClips = db.submissions.filter(
    (s) =>
      s.status === 'selected' || s.status === 'posted' || s.status === 'paid'
  );

  const [postUrlMap, setPostUrlMap] = useState<Record<string, string>>({});
  const [initViewsMap, setInitViewsMap] = useState<Record<string, number>>({});
  const [initProofMap, setInitProofMap] = useState<Record<string, string>>({});

  const [snapViewsMap, setSnapViewsMap] = useState<Record<string, number>>({});
  const [snapProofMap, setSnapProofMap] = useState<Record<string, string>>({});

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSavePostUrl = (submissionId: string) => {
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const post_url =
        postUrlMap[submissionId] ||
        'https://www.tiktok.com/@apexclipspage/video/7409988776655';
      const initial_views = initViewsMap[submissionId] ?? 1200;
      const proof_url =
        initProofMap[submissionId] ||
        'https://storage.whap.app/proofs/initial-post-screenshot.png';

      submitPostUrlForClip({
        submission_id: submissionId,
        post_url,
        initial_views,
        proof_url,
      });
      setToastMsg('Post link saved! View tracking is now active.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleAddSnapshot = (submissionId: string, currentViews: number) => {
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const views = snapViewsMap[submissionId] ?? currentViews + 8500;
      const proof_url =
        snapProofMap[submissionId] ||
        'https://storage.whap.app/proofs/day14-analytics-proof.png';

      recordManualViewSnapshot({
        submission_id: submissionId,
        views,
        proof_url,
      });
      setToastMsg('View snapshot saved and editor pay recalculated.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleFlagMissedDeadlines = () => {
    const count = triggerMissedDeadlineCheck();
    setToastMsg(
      count > 0
        ? `Flagged ${count} overdue clip and alerted the editor and admin.`
        : 'All picked clips are within their 72h posting window.'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">
            Posted Clips &amp; View Tracking
          </h1>
          <p className="mt-1 text-sm text-muted">
            Post picked clips within 72 hours and log view counts with screenshot
            proof at least every 7 days.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFlagMissedDeadlines}
          className="btn-sticker btn-sun text-xs"
        >
          <Clock weight="bold" className="h-4 w-4" />
          <span>Check 72h Post Deadlines</span>
        </button>
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

      <div className="space-y-6">
        {activeClips.map((sub) => {
          const camp = db.campaigns.find((c) => c.id === sub.campaign_id);
          const editor = db.profiles.find((p) => p.id === sub.editor_id);
          const snapshots = db.view_snapshots.filter(
            (v) => v.submission_id === sub.id
          );
          const deadlineInfo = getPostDeadlineStatus(sub);
          const reminderInfo = getViewUpdateReminderStatus(
            sub,
            db.settings.view_update_interval_days
          );

          // Calculate 30-day tracking window progress bar
          const windowDays = camp?.view_tracking_window_days || 30;
          const elapsedDays = sub.posted_at
            ? Math.min(
                windowDays,
                Math.max(
                  1,
                  Math.round(
                    (Date.now() - new Date(sub.posted_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              )
            : 0;
          const windowPct = Math.min(
            100,
            Math.round((elapsedDays / windowDays) * 100)
          );

          return (
            <div
              key={sub.id}
              className="card-sticker p-6 grid grid-cols-1 gap-6 lg:grid-cols-12"
            >
              {/* Left 4 Cols: Clean Master Video */}
              <div className="lg:col-span-4">
                <ProtectedVideoPlayer
                  submissionId={sub.id}
                  editorUsername={editor?.username || 'editor'}
                  status={sub.status}
                  fileName={sub.file_name}
                  durationSec={sub.duration_sec}
                  previewVideoUrl={sub.preview_video_url}
                  externalLink={sub.external_link}
                  aspectRatio={camp?.aspect_ratio || '9:16'}
                />
              </div>

              {/* Right 8 Cols: Post URL Form + View Snapshots */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-forest">
                      {camp?.title}
                    </span>
                    <h2 className="font-display text-2xl text-ink">
                      {sub.file_name} · Editor @{editor?.username}
                    </h2>
                  </div>
                  <SubmissionStatusChip status={sub.status} />
                </div>

                {/* Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <div className="rounded-btn border-2 border-ink bg-mint p-3">
                    <span className="text-xs font-bold text-muted">
                      Counted Views
                    </span>
                    <p className="font-display text-xl text-ink tabular-nums">
                      {sub.counted_views.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-btn border-2 border-ink bg-sprout p-3">
                    <span className="text-xs font-extrabold text-ink">
                      Editor Earnings
                    </span>
                    <p className="font-display text-xl text-ink tabular-nums">
                      {formatMoneyCents(
                        sub.net_earnings_cents,
                        camp?.currency || 'USD'
                      )}
                    </p>
                  </div>
                </div>

                {/* Case A: Clip is selected and needs Post URL within 72h */}
                {!sub.posted_url ? (
                  <div className="rounded-card border-2 border-ink bg-mint p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-ink">
                        Step 1: Post this clip on your page &amp; add the link
                      </span>
                      <span
                        className={`chip-sticker ${
                          deadlineInfo.state === 'overdue'
                            ? 'bg-coral text-ink'
                            : 'bg-sun text-ink'
                        }`}
                      >
                        <Clock weight="bold" className="h-3.5 w-3.5" />
                        <span>{deadlineInfo.label}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`post-url-${sub.id}`}
                          className="mb-1 block text-xs font-extrabold text-ink"
                        >
                          Paste the link where you posted it
                        </label>
                        <input
                          id={`post-url-${sub.id}`}
                          type="url"
                          value={
                            postUrlMap[sub.id] ??
                            'https://www.tiktok.com/@apexclipspage/video/7409988776655'
                          }
                          onChange={(e) =>
                            setPostUrlMap((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          className="input-sticker"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`init-views-${sub.id}`}
                          className="mb-1 block text-xs font-extrabold text-ink"
                        >
                          Current views
                        </label>
                        <input
                          id={`init-views-${sub.id}`}
                          type="number"
                          value={initViewsMap[sub.id] ?? 1200}
                          onChange={(e) =>
                            setInitViewsMap((prev) => ({
                              ...prev,
                              [sub.id]: Number(e.target.value),
                            }))
                          }
                          className="input-sticker tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`init-proof-${sub.id}`}
                        className="mb-1 block text-xs font-extrabold text-ink"
                      >
                        Screenshot proof URL
                      </label>
                      <input
                        id={`init-proof-${sub.id}`}
                        type="url"
                        value={
                          initProofMap[sub.id] ??
                          'https://storage.whap.app/proofs/initial-post-screenshot.png'
                        }
                        onChange={(e) =>
                          setInitProofMap((prev) => ({
                            ...prev,
                            [sub.id]: e.target.value,
                          }))
                        }
                        className="input-sticker"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSavePostUrl(sub.id)}
                      className="btn-sticker btn-primary text-xs"
                    >
                      <Broadcast weight="bold" className="h-4 w-4" />
                      <span>Save Post URL &amp; Start View Tracking</span>
                    </button>
                  </div>
                ) : (
                  /* Case B: Clip is Posted Live -> Show Post Link, 30-day Window Bar & 7-day Snapshot Updater */
                  <div className="space-y-4">
                    <div className="rounded-btn border-2 border-ink bg-mint p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-extrabold text-ink">
                        Post URL:{' '}
                        <a
                          href={sub.posted_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-forest underline"
                        >
                          {sub.posted_url}
                        </a>
                      </span>
                      <span
                        className={`chip-sticker ${
                          reminderInfo.isDue
                            ? 'bg-sun text-ink'
                            : 'bg-sprout text-ink'
                        }`}
                      >
                        {reminderInfo.label}
                      </span>
                    </div>

                    {/* 30-Day View Tracking Window Progress Bar (12px tall, ink border, sprout fill) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-extrabold text-ink">
                        <span>{windowDays}-day view tracking window</span>
                        <span className="tabular-nums">
                          Day {elapsedDays} of {windowDays}
                        </span>
                      </div>
                      <div className="progress-sticker">
                        <div
                          className="progress-sticker-fill"
                          style={{ width: `${windowPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Log New 7-Day View Snapshot */}
                    <div className="rounded-card border-2 border-ink bg-mint p-4 space-y-3">
                      <h3 className="text-xs font-extrabold uppercase text-ink">
                        Log 7-Day View Update + Screenshot Proof
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label
                            htmlFor={`snap-views-${sub.id}`}
                            className="mb-1 block text-xs font-extrabold text-ink"
                          >
                            Updated view count
                          </label>
                          <input
                            id={`snap-views-${sub.id}`}
                            type="number"
                            value={
                              snapViewsMap[sub.id] ?? sub.counted_views + 8500
                            }
                            onChange={(e) =>
                              setSnapViewsMap((prev) => ({
                                ...prev,
                                [sub.id]: Number(e.target.value),
                              }))
                            }
                            className="input-sticker tabular-nums"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`snap-proof-${sub.id}`}
                            className="mb-1 block text-xs font-extrabold text-ink"
                          >
                            Screenshot proof link
                          </label>
                          <input
                            id={`snap-proof-${sub.id}`}
                            type="url"
                            value={
                              snapProofMap[sub.id] ??
                              'https://storage.whap.app/proofs/day14-analytics-proof.png'
                            }
                            onChange={(e) =>
                              setSnapProofMap((prev) => ({
                                ...prev,
                                [sub.id]: e.target.value,
                              }))
                            }
                            className="input-sticker"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleAddSnapshot(sub.id, sub.counted_views)
                        }
                        className="btn-sticker btn-primary py-2 px-4 text-xs"
                      >
                        <PlusCircle weight="bold" className="h-4 w-4" />
                        <span>Save View Snapshot</span>
                      </button>
                    </div>

                    {/* View Snapshots History */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-extrabold uppercase text-ink">
                        View Snapshots ({snapshots.length})
                      </h3>
                      <div className="space-y-1.5">
                        {snapshots.map((snap) => (
                          <div
                            key={snap.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-btn border-2 border-ink bg-paper px-3.5 py-2.5 text-xs tabular-nums"
                          >
                            <div>
                              <span className="font-extrabold text-ink">
                                {snap.views.toLocaleString()} views
                              </span>
                              <span className="ml-2 font-bold text-muted">
                                ({new Date(snap.created_at).toLocaleDateString()} ·{' '}
                                {snap.source})
                              </span>
                            </div>
                            <a
                              href={snap.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-extrabold text-forest underline"
                            >
                              <span>Proof</span>
                              <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
