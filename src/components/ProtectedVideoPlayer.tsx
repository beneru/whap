'use client';

import React, { useState } from 'react';
import { Download, Eye, Lock, Play, ShieldAlert, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { CurrencyCode, Submission } from '@/lib/types';
import { formatMoneyCents } from '@/lib/payout-math';

interface ProtectedVideoPlayerProps {
  submission: Submission;
  editorUsername: string;
  currency?: CurrencyCode;
  compact?: boolean;
}

/**
 * 9:16 Vertical Review Bay with Editor Protection:
 * - Before selection (`submitted`, `revision_requested`, `resubmitted`, `rejected`):
 *   Shows a short-lived signed preview stream overlaid with a diagonal dynamic watermark
 *   containing the editor's `@username`, disables context menu & download controls.
 * - After selection (`selected`, `posted`, `paid`):
 *   Removes the preview watermark and unlocks the Clean Master File download button.
 */
export function ProtectedVideoPlayer({
  submission,
  editorUsername,
  currency = 'USD',
  compact = false,
}: ProtectedVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const isCleanUnlocked =
    submission.clean_file_unlocked ||
    ['selected', 'posted', 'paid'].includes(submission.status);

  const handleCleanDownload = async () => {
    if (!isCleanUnlocked) return;
    const token = btoa(
      JSON.stringify({
        path: submission.storage_path || submission.file_name,
        mode: 'clean_download',
        editor: editorUsername,
        exp: Date.now() + 3600 * 1000,
      })
    );
    const res = await fetch(
      `/api/submissions/media?path=${encodeURIComponent(
        submission.storage_path || submission.file_name || 'clip.mp4'
      )}&mode=clean_download&token=${encodeURIComponent(token)}`
    );
    if (res.ok) {
      setDownloadToast(
        `Clean master file (${submission.file_name || 'clip-master.mp4'}) unlocked and downloading.`
      );
      setTimeout(() => setDownloadToast(null), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div
        onContextMenu={(e) => e.preventDefault()}
        className={`relative mx-auto w-full overflow-hidden rounded-xl border bg-inset select-none ${
          compact ? 'max-w-[240px] aspect-[9/16]' : 'max-w-[310px] aspect-[9/16]'
        } ${
          isCleanUnlocked ? 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.08)]' : 'border-white/10'
        }`}
      >
        {/* Top Monitor Bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/50 to-transparent px-3 py-2.5 text-[11px]">
          <span className="font-mono text-zinc-300 truncate max-w-[65%]">
            {submission.file_name || 'vertical-clip.mp4'}
          </span>
          <span className="font-mono rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-zinc-300 border border-white/10">
            00:{String(submission.duration_sec || 35).padStart(2, '0')} · 9:16
          </span>
        </div>

        {/* Simulated or Real HTML5 Video Canvas */}
        {submission.preview_video_url ? (
          <video
            src={submission.preview_video_url}
            className="h-full w-full object-cover"
            playsInline
            loop
            muted={muted}
            autoPlay={isPlaying}
            controlsList="nodownload nofullscreen"
            disablePictureInPicture
            onClick={() => setIsPlaying(!isPlaying)}
          />
        ) : (
          <div
            onClick={() => setIsPlaying(!isPlaying)}
            className="relative flex h-full w-full cursor-pointer flex-col items-center justify-between bg-gradient-to-b from-zinc-900 via-[#121624] to-zinc-950 p-4"
          >
            {/* Dynamic visual waveform / frame graphic */}
            <div className="mt-10 flex flex-col items-center text-center">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono text-zinc-300">
                <Eye className="h-3 w-3 text-tally-bright" />
                {isCleanUnlocked ? 'MASTER 1080x1920 60FPS' : 'SIGNED STREAM · 5M TTL'}
              </div>
              <p className="mt-2 line-clamp-3 px-2 text-sm font-bold leading-snug text-white drop-shadow">
                &ldquo;{submission.suggested_caption || submission.file_name}&rdquo;
              </p>
            </div>

            {/* Play / Pause Button */}
            <button
              type="button"
              aria-label={isPlaying ? 'Pause clip preview' : 'Play clip preview'}
              className="group relative z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur transition hover:scale-105 hover:border-tally-bright"
            >
              {isPlaying ? (
                <div className="flex gap-1.5">
                  <span className="h-4 w-1.5 rounded-sm bg-tally-bright animate-pulse" />
                  <span className="h-4 w-1.5 rounded-sm bg-tally-bright animate-pulse" />
                </div>
              ) : (
                <Play className="h-6 w-6 translate-x-0.5 text-tally-bright fill-tally-bright" />
              )}
            </button>

            {/* Kinetic Captions Preview Bar */}
            <div className="mb-10 w-full space-y-2">
              <div className="mx-auto w-fit rounded bg-amber-400 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-black shadow">
                {isPlaying ? 'HOOK FRAME ACTIVE' : 'TAP TO STREAM CLIP'}
              </div>
              <div className="flex items-center justify-between gap-1 px-2">
                {[35, 65, 90, 50, 80, 95, 60, 75, 85, 45, 70, 88].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${Math.max(8, Math.round(h * 0.28))}px` }}
                    className={`w-1.5 rounded-full transition-all ${
                      isPlaying ? 'bg-tally-bright animate-pulse' : 'bg-zinc-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANTI-THEFT WATERMARK OVERLAY (Active whenever clip is NOT yet selected!) */}
        {!isCleanUnlocked && (
          <div
            aria-label={`Watermarked preview for @${editorUsername}`}
            className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-evenly overflow-hidden opacity-75"
          >
            {[-1, 0, 1, 2].map((row) => (
              <div
                key={row}
                className="-rotate-24 whitespace-nowrap bg-black/35 py-1 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-amber-300/80 border-y border-amber-400/20"
              >
                @{editorUsername} · WHAP PREVIEW · DO NOT REPOST · @{editorUsername}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Protection Status Overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 py-2.5">
          {isCleanUnlocked ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Clean Master Unlocked</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300">
              <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>Watermarked · No Download</span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMuted(!muted);
            }}
            className="rounded-md bg-white/10 p-1.5 text-zinc-200 hover:bg-white/20"
            title={muted ? 'Unmute preview' : 'Mute preview'}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Clean File Unlock / Rate Lock Action Bar */}
      <div className="mx-auto w-full max-w-[310px]">
        {isCleanUnlocked ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="text-emerald-200">
                <span className="font-semibold">Rate Locked:</span>{' '}
                <span className="font-mono">
                  {formatMoneyCents(submission.locked_rate_per_1k_cents || 0, currency)}/1k
                </span>
                {(submission.locked_base_fee_cents || 0) > 0 && (
                  <span className="font-mono">
                    {' '}
                    + {formatMoneyCents(submission.locked_base_fee_cents || 0, currency)} base
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCleanDownload}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-2.5 py-1.5 font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                <Download className="h-3.5 w-3.5" />
                Clean File
              </button>
            </div>
            {downloadToast && (
              <p className="mt-1.5 font-mono text-[11px] text-emerald-300">{downloadToast}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-surface px-3 py-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Select clip to remove watermark &amp; unlock master file
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
