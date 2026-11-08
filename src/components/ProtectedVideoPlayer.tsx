'use client';

import React from 'react';
import {
  ArrowSquareOut,
  CheckCircle,
  DownloadSimple,
  FilmSlate,
  LockKey,
  ShieldCheck,
} from '@phosphor-icons/react';
import { SubmissionStatus } from '@/lib/types';

interface ProtectedVideoPlayerProps {
  submissionId: string;
  editorUsername: string;
  status: SubmissionStatus;
  fileName: string | null;
  durationSec: number;
  previewVideoUrl?: string | null;
  externalLink?: string | null;
  aspectRatio?: string;
}

export function ProtectedVideoPlayer({
  editorUsername,
  status,
  fileName,
  durationSec,
  previewVideoUrl,
  externalLink,
  aspectRatio = '9:16',
}: ProtectedVideoPlayerProps) {
  const safeFileName = fileName || 'clip-upload.mp4';
  const isCleanFileAvailable =
    status === 'selected' || status === 'posted' || status === 'paid';

  return (
    <div
      onContextMenu={(e) => {
        if (!isCleanFileAvailable) e.preventDefault();
      }}
      className="card-sticker overflow-hidden bg-mint"
    >
      {/* Top Sticker Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-paper px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <FilmSlate weight="bold" className="h-4 w-4 text-ink" />
          <span className="font-extrabold text-ink">{safeFileName}</span>
          <span className="rounded-full border-2 border-ink bg-mint px-2 py-0.5 font-extrabold text-ink tabular-nums">
            {aspectRatio} · {durationSec}s
          </span>
        </div>

        {isCleanFileAvailable ? (
          <span className="chip-sticker bg-sprout text-ink">
            <CheckCircle weight="bold" className="h-3.5 w-3.5" />
            <span>Clean file ready</span>
          </span>
        ) : (
          <span className="chip-sticker bg-sun text-ink">
            <LockKey weight="bold" className="h-3.5 w-3.5" />
            <span>Preview only · Watermarked</span>
          </span>
        )}
      </div>

      {/* 9:16 Video Preview Canvas (Never autoplays to save mobile data) */}
      <div className="relative mx-auto flex aspect-[9/16] max-h-[420px] w-full max-w-[260px] flex-col items-center justify-center my-4 rounded-card border-2 border-ink bg-paper p-4 shadow-card overflow-hidden">
        {previewVideoUrl && previewVideoUrl.startsWith('blob:') ? (
          <video
            src={previewVideoUrl}
            controls
            preload="metadata"
            controlsList={isCleanFileAvailable ? undefined : 'nodownload'}
            disablePictureInPicture={!isCleanFileAvailable}
            className="h-full w-full rounded-btn object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-btn border-2 border-dashed border-ink bg-mint p-4 text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-sprout shadow-btn">
              <FilmSlate weight="bold" className="h-6 w-6 text-ink" />
            </div>
            <p className="font-display text-xl text-ink">@{editorUsername}</p>
            <p className="text-xs font-extrabold text-ink">{safeFileName}</p>
            <p className="text-[11px] font-bold text-muted">
              Tap play when ready (no autoplay on mobile data)
            </p>
          </div>
        )}

        {/* Watermark Overlay Before Selection */}
        {!isCleanFileAvailable && (
          <div
            aria-label={`Watermarked preview for @${editorUsername}`}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-3 select-none"
          >
            <span className="rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-ink">
              PREVIEW · @{editorUsername}
            </span>
            <span className="-rotate-12 rounded-btn border-2 border-ink bg-paper/95 px-3 py-1 font-display text-xl text-ink shadow-btn">
              @{editorUsername}
            </span>
            <span className="rounded-full border-2 border-ink bg-paper px-2.5 py-0.5 text-[10px] font-extrabold text-ink">
              Pick clip to get clean file
            </span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Download Clean File (only after Pick) or Protection Notice */}
      <div className="border-t-2 border-ink bg-paper px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        {isCleanFileAvailable ? (
          <>
            <span className="inline-flex items-center gap-1.5 font-extrabold text-forest">
              <ShieldCheck weight="bold" className="h-4 w-4" />
              <span>Rate locked · Watermark removed</span>
            </span>
            <a
              href={externalLink || previewVideoUrl || `#clean-${safeFileName}`}
              download={safeFileName}
              target={externalLink ? '_blank' : undefined}
              rel="noreferrer"
              className="btn-sticker btn-primary py-1.5 px-3.5 text-xs min-h-[40px]"
            >
              {externalLink ? (
                <>
                  <ArrowSquareOut weight="bold" className="h-4 w-4" />
                  <span>Open Clean Link</span>
                </>
              ) : (
                <>
                  <DownloadSimple weight="bold" className="h-4 w-4" />
                  <span>Download Clean File</span>
                </>
              )}
            </a>
          </>
        ) : (
          <p className="font-bold text-muted">
            Download is disabled until you pick this clip.
          </p>
        )}
      </div>
    </div>
  );
}
