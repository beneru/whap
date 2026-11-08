'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileVideo,
  Link2,
  Pause,
  Play,
  ShieldCheck,
  UploadCloud,
  WifiOff,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import {
  calculateAccountHolderReputation,
  calculateCampaignBudgetSummary,
  calculateClipEarningsCents,
  formatMoneyCents,
} from '@/lib/payout-math';
import { CampaignStatusChip, PlatformBadge, SubmissionStatusChip } from '@/components/StatusChip';
import {
  ResumableUploadController,
  ResumableUploadProgress,
  startResumableVideoUpload,
} from '@/lib/tus-upload';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { db, currentUser, openAuthModal, createSubmission } = useWhap();

  const campaign = db.campaigns.find((c) => c.id === params.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadControllerRef = useRef<ResumableUploadController | null>(null);

  const [submitDrawerOpen, setSubmitDrawerOpen] = useState(false);
  const [sourceType, setSourceType] = useState<'upload' | 'link'>('upload');
  const [uploadProgress, setUploadProgress] = useState<ResumableUploadProgress | null>(null);
  const [uploadedStoragePath, setUploadedStoragePath] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | undefined>(undefined);
  const [externalLink, setExternalLink] = useState('');
  const [durationSec, setDurationSec] = useState(38);
  const [suggestedCaption, setSuggestedCaption] = useState('');
  const [hashtagsText, setHashtagsText] = useState('#clips #fyp #viral');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [calcViews, setCalcViews] = useState(20000);

  if (!campaign) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <p className="text-base font-bold text-white">Campaign not found</p>
        <Link href="/campaigns" className="mt-3 inline-block text-xs text-tally-bright hover:underline">
          Back to Campaigns
        </Link>
      </div>
    );
  }

  const owner = db.profiles.find((p) => p.id === campaign.owner_id);
  const budget = calculateCampaignBudgetSummary(campaign, db.submissions);
  const holderRep = calculateAccountHolderReputation(
    campaign.owner_id,
    db.campaigns,
    db.submissions,
    db.payout_requests,
    db.disputes
  );

  const mySubmissions = currentUser
    ? db.submissions.filter(
        (s) => s.campaign_id === campaign.id && s.editor_id === currentUser.id
      )
    : [];

  const estEarnings = calculateClipEarningsCents({
    countedViews: calcViews,
    ratePer1kCents: campaign.rate_per_1k_cents,
    baseFeeCents: campaign.base_fee_cents,
    maxPayoutPerClipCents: campaign.max_payout_per_clip_cents,
    remainingCampaignBudgetCents: budget.remainingBudgetCents,
    platformFeePercent: db.settings.platform_fee_percent,
  });

  // Login is required ONLY when tapping Submit!
  const handleTapSubmitButton = () => {
    if (!currentUser) {
      openAuthModal(`/campaigns/${campaign.id}`);
      return;
    }
    setSubmitDrawerOpen(true);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleFileSelected = (file: File | undefined) => {
    if (!file || !currentUser) return;
    setSubmitError(null);
    const controller = startResumableVideoUpload({
      file,
      editorId: currentUser.id,
      campaignId: campaign.id,
      onProgress: (prog) => setUploadProgress(prog),
      onSuccess: (res) => {
        setUploadedStoragePath(res.storagePath);
        setUploadedFileName(res.fileName);
        setUploadedFileSize(res.fileSizeBytes);
        setLocalBlobUrl(res.localBlobUrl);
      },
      onError: (err) => setSubmitError(err.message),
    });
    uploadControllerRef.current = controller;
  };

  const handleSimulatedSampleVideo = () => {
    const mockBytes = new Uint8Array(1024 * 256);
    const sampleFile = new File([mockBytes], `edit-${campaign.niche.toLowerCase()}-9x16.mp4`, {
      type: 'video/mp4',
    });
    handleFileSelected(sampleFile);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      const hashtags = hashtagsText
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`));

      const created = createSubmission({
        campaign_id: campaign.id,
        source_type: sourceType,
        storage_path: sourceType === 'upload' ? uploadedStoragePath : null,
        external_link: sourceType === 'link' ? externalLink.trim() : null,
        preview_video_url: localBlobUrl,
        file_name:
          sourceType === 'upload'
            ? uploadedFileName || 'clip-upload.mp4'
            : 'drive-linked-clip.mp4',
        file_size_bytes: uploadedFileSize || 38400000,
        duration_sec: durationSec,
        suggested_caption: suggestedCaption,
        hashtags,
        notes,
      });

      setSubmitSuccess(
        `Submitted "${created.file_name}"! Watermark protection is active until the Account Holder selects your clip.`
      );
      setSuggestedCaption('');
      setNotes('');
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Campaigns
        </Link>

        {currentUser &&
          (currentUser.id === campaign.owner_id || currentUser.role === 'admin') && (
            <Link
              href={`/holder/campaigns/${campaign.id}/edit`}
              className="rounded-xl border border-white/15 bg-surface px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:border-white/30"
            >
              Edit Campaign
            </Link>
          )}
      </div>

      {/* Main Campaign Header & Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8 Cols: Campaign Brief, Source Links, Format Specs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold text-zinc-200">
                  {campaign.niche}
                </span>
                <CampaignStatusChip status={campaign.status} />
              </div>
              <span className="font-mono text-xs text-zinc-400">
                Deadline: {new Date(campaign.submission_deadline).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{campaign.title}</h1>

            <div className="flex flex-wrap items-center gap-2">
              {campaign.platforms.map((pl) => (
                <PlatformBadge key={pl} platform={pl} />
              ))}
              {campaign.target_page_handles.map((handle) => (
                <span
                  key={handle}
                  className="rounded-md border border-tally/30 bg-tally/10 px-2.5 py-0.5 font-mono text-xs text-tally-bright"
                >
                  Target Page: {handle}
                </span>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Editing Brief &amp; Instructions
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-zinc-200 leading-relaxed">
                {campaign.brief}
              </p>
            </div>

            {campaign.hook_notes && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  First 3-Second Hook Requirement
                </span>
                <p className="mt-1 text-xs text-amber-100">{campaign.hook_notes}</p>
              </div>
            )}

            {/* Format Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-xl border border-white/10 bg-elevated p-3">
                <span className="text-[10px] uppercase text-zinc-400">Aspect Ratio</span>
                <p className="mt-0.5 font-mono text-sm font-bold text-white">
                  {campaign.aspect_ratio} Vertical
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-elevated p-3">
                <span className="text-[10px] uppercase text-zinc-400">Clip Duration</span>
                <p className="mt-0.5 font-mono text-sm font-bold text-white">
                  {campaign.min_length_sec}s - {campaign.max_length_sec}s
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-elevated p-3">
                <span className="text-[10px] uppercase text-zinc-400">Captions Required</span>
                <p className="mt-0.5 font-mono text-sm font-bold text-emerald-300">
                  {campaign.captions_required ? 'Yes (Burned-In)' : 'Optional'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-elevated p-3">
                <span className="text-[10px] uppercase text-zinc-400">Max / Editor</span>
                <p className="mt-0.5 font-mono text-sm font-bold text-white">
                  {campaign.max_submissions_per_editor} clips
                </p>
              </div>
            </div>

            {/* Source Material Links */}
            <div className="border-t border-white/10 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Raw Source Material Footage
              </h2>
              <div className="mt-2 space-y-2">
                {campaign.source_links.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-xs text-tally-bright hover:border-tally/40"
                  >
                    <span className="truncate font-mono">{url}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Clip Drawer / Section */}
          {submitDrawerOpen && currentUser && (
            <div
              id="submit-clip-panel"
              className="rounded-2xl border border-tally/40 bg-elevated p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-tally-bright">
                    Protected Private Bucket · Watermarked Until Selected
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    Submit Clip to &ldquo;{campaign.title}&rdquo;
                  </h2>
                </div>
                <span className="font-mono text-xs text-zinc-400">
                  {mySubmissions.filter((s) => s.status !== 'rejected').length} /{' '}
                  {campaign.max_submissions_per_editor} used
                </span>
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-xs text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {submitSuccess}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => router.push('/editor/submissions')}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-zinc-950"
                    >
                      Track in My Submissions
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleFinalSubmit} className="space-y-4">
                {/* Upload Mode Switcher: Resumable TUS Upload vs Drive/Dropbox Link */}
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-inset p-1">
                  <button
                    type="button"
                    onClick={() => setSourceType('upload')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                      sourceType === 'upload'
                        ? 'bg-tally text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <UploadCloud className="h-4 w-4" />
                    Resumable Video Upload (MP4/MOV)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('link')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                      sourceType === 'link'
                        ? 'bg-tally text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Link2 className="h-4 w-4" />
                    Drive / Dropbox Link
                  </button>
                </div>

                {sourceType === 'upload' ? (
                  <div className="rounded-xl border border-dashed border-white/20 bg-inset p-5 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,.mp4,.mov"
                      onChange={(e) => handleFileSelected(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tally/15 text-tally-bright">
                          <FileVideo className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {uploadedFileName || 'Upload MP4 or MOV (Max 500MB · TUS Resumable)'}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Auto-retries on unstable mobile internet and resumes from last saved chunk.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200"
                        >
                          Choose Video File
                        </button>
                        <button
                          type="button"
                          onClick={handleSimulatedSampleVideo}
                          className="rounded-lg border border-tally/40 bg-tally/15 px-3 py-2 text-xs font-semibold text-tally-bright hover:bg-tally/25"
                        >
                          Use Sample 9:16 Clip
                        </button>
                      </div>
                    </div>

                    {/* Resumable Upload Progress + Network Drop Simulator */}
                    {uploadProgress && (
                      <div className="rounded-xl border border-white/10 bg-surface p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-white">
                            {uploadProgress.message}
                          </span>
                          <span className="font-mono font-bold text-tally-bright">
                            {uploadProgress.percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full transition-all ${
                              uploadProgress.status === 'retrying'
                                ? 'bg-amber-400'
                                : uploadProgress.status === 'completed'
                                ? 'bg-emerald-400'
                                : 'bg-tally'
                            }`}
                            style={{ width: `${uploadProgress.percentage}%` }}
                          />
                        </div>

                        {uploadProgress.status !== 'completed' && (
                          <div className="flex items-center gap-2 pt-1">
                            {uploadProgress.status === 'paused' ? (
                              <button
                                type="button"
                                onClick={() => uploadControllerRef.current?.resume()}
                                className="inline-flex items-center gap-1 rounded bg-tally px-2.5 py-1 text-[11px] font-bold text-zinc-950"
                              >
                                <Play className="h-3 w-3" /> Resume From Saved Offset
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => uploadControllerRef.current?.pause()}
                                className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-[11px] text-zinc-200"
                              >
                                <Pause className="h-3 w-3" /> Pause
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => uploadControllerRef.current?.simulateNetworkDrop()}
                              className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300"
                            >
                              <WifiOff className="h-3 w-3" /> Simulate Mobile Network Drop
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Google Drive or Dropbox Video URL
                    </label>
                    <input
                      type="url"
                      required={sourceType === 'link'}
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-tally-bright focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Suggested Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={suggestedCaption}
                      onChange={(e) => setSuggestedCaption(e.target.value)}
                      placeholder="Hook caption for TikTok / Reels / Shorts..."
                      className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-tally-bright focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Clip Length (sec)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={durationSec}
                      onChange={(e) => setDurationSec(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2 font-mono text-xs text-white focus:border-tally-bright focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Hashtags (Optional)
                    </label>
                    <input
                      type="text"
                      value={hashtagsText}
                      onChange={(e) => setHashtagsText(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2 font-mono text-xs text-white focus:border-tally-bright focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Editor Notes for Account Holder (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Added retention chart at 0:14..."
                      className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-tally-bright focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-tally py-3 text-sm font-extrabold text-zinc-950 shadow-lg transition hover:bg-tally-bright"
                >
                  Submit Protected Clip to Review Queue
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Submit CTA, Budget Meter, Payout Calculator, Account Holder Trust */}
        <div className="lg:col-span-4 space-y-5">
          {/* Primary Submit Box */}
          <div className="rounded-2xl border border-tally/35 bg-surface p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Pay Rate / 1,000 Views
              </span>
              <span className="font-mono text-2xl font-extrabold text-tally-bright">
                {formatMoneyCents(campaign.rate_per_1k_cents, campaign.currency)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-elevated p-3 text-xs">
              <div>
                <span className="text-[10px] uppercase text-zinc-400">Base Fee on Select</span>
                <p className="font-mono font-bold text-white">
                  {formatMoneyCents(campaign.base_fee_cents, campaign.currency)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-zinc-400">Max View Bonus / Clip</span>
                <p className="font-mono font-bold text-white">
                  {formatMoneyCents(campaign.max_payout_per_clip_cents, campaign.currency)}
                </p>
              </div>
            </div>

            {/* Remaining Budget Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Remaining Campaign Budget</span>
                <span className="font-mono font-bold text-emerald-300">
                  {formatMoneyCents(budget.remainingBudgetCents, campaign.currency)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-tally"
                  style={{ width: `${Math.max(4, 100 - budget.percentUsed)}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                <span>
                  Accrued: {formatMoneyCents(budget.accruedBudgetCents, campaign.currency)}
                </span>
                <span>
                  Cap: {formatMoneyCents(budget.totalBudgetCapCents, campaign.currency)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTapSubmitButton}
              disabled={budget.isExhausted || campaign.status !== 'open'}
              className="w-full rounded-xl bg-tally py-3 text-sm font-extrabold text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.25)] transition hover:bg-tally-bright disabled:opacity-40"
            >
              {currentUser
                ? submitDrawerOpen
                  ? 'Submission Form Open Below'
                  : 'Submit Edited Clip'
                : 'Submit Clip (1-Click Sign In)'}
            </button>

            <p className="text-center text-[11px] text-zinc-400">
              {campaign.view_tracking_window_days}-day view tracking window ·{' '}
              {campaign.post_deadline_hours}h posting SLA after selection
            </p>
          </div>

          {/* Interactive Payout Calculator for This Campaign */}
          <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Payout Calculator for This Campaign
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">If your clip gets:</span>
                <span className="font-mono font-bold text-white">
                  {calcViews.toLocaleString()} views
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={60000}
                step={1000}
                value={calcViews}
                onChange={(e) => setCalcViews(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-tally/30 bg-tally/10 px-3.5 py-2.5">
              <span className="text-xs font-medium text-emerald-200">Your Clip Earnings</span>
              <span className="font-mono text-lg font-extrabold text-white">
                {formatMoneyCents(estEarnings.netEarningsCents, campaign.currency)}
              </span>
            </div>
          </div>

          {/* Account Holder Reputation Scorecard */}
          <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-tally-bright">
                  Verified Page Owner
                </span>
                <Link
                  href={`/holders/${campaign.owner_id}`}
                  className="block text-sm font-bold text-white hover:text-tally-bright"
                >
                  {owner?.display_name} (@{owner?.username})
                </Link>
              </div>
              <ShieldCheck className="h-5 w-5 text-tally-bright" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-white/5 bg-elevated p-2.5">
                <span className="text-[10px] text-zinc-400">Campaigns Run</span>
                <p className="font-mono font-bold text-white">{holderRep.campaigns_run}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-elevated p-2.5">
                <span className="text-[10px] text-zinc-400">Clips Selected</span>
                <p className="font-mono font-bold text-white">{holderRep.clips_selected}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-elevated p-2.5">
                <span className="text-[10px] text-zinc-400">Total Paid Out</span>
                <p className="font-mono font-bold text-emerald-300">
                  {formatMoneyCents(holderRep.total_paid_out_cents, 'USD')}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-elevated p-2.5">
                <span className="text-[10px] text-zinc-400">% Posted on Time</span>
                <p className="font-mono font-bold text-emerald-300">
                  {holderRep.on_time_post_percent}%
                </p>
              </div>
            </div>

            {holderRep.missed_deadlines_count > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {holderRep.missed_deadlines_count} missed 72h post deadline flagged
              </div>
            )}

            <Link
              href={`/holders/${campaign.owner_id}`}
              className="block text-center text-xs font-semibold text-tally-bright hover:underline"
            >
              View Full Account Holder Profile &rarr;
            </Link>
          </div>

          {/* Editor's Existing Submissions to this Campaign */}
          {mySubmissions.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Your Submissions ({mySubmissions.length})
              </h3>
              <div className="space-y-2">
                {mySubmissions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-elevated p-2.5 text-xs"
                  >
                    <span className="truncate font-mono text-zinc-200 max-w-[140px]">
                      {s.file_name}
                    </span>
                    <SubmissionStatusChip status={s.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
