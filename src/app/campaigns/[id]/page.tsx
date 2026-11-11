'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  CheckCircle,
  Clock,
  Copy,
  DownloadSimple,
  FileText,
  Image as ImageIcon,
  LinkSimple,
  MusicNotes,
  NotePencil,
  Pause,
  Play,
  ShieldCheck,
  SpeakerHigh,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { InstructionAsset } from '@/lib/types';
import {
  calculateAccountHolderReputation,
  calculateCampaignBudgetSummary,
  calculateSubmissionEarnings,
  formatMoneyCents,
} from '@/lib/payout-math';
import {
  CampaignStatusChip,
  PlatformBadge,
  SubmissionStatusChip,
} from '@/components/StatusChip';
import {
  ResumableUploadController,
  ResumableUploadProgress,
  startResumableClipUpload,
} from '@/lib/tus-upload';
import { ClappyMascot } from '@/components/ClappyMascot';
import { getDaysLeftLabel } from '@/components/CampaignCard';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { db, currentUser, setAuthModalOpen, createSubmission } = useWhap();

  const campaign = db.campaigns.find((c) => c.id === params.id);

  const [submitDrawerOpen, setSubmitDrawerOpen] = useState(false);
  const [sourceType, setSourceType] = useState<'upload' | 'link'>('upload');
  const [externalLink, setExternalLink] = useState(
    'https://drive.google.com/file/d/1xYz987654321_cut_v1/view'
  );
  const [durationSec, setDurationSec] = useState<number>(38);
  const [suggestedCaption, setSuggestedCaption] = useState(
    'Why 90% of manual operations break at 15 employees'
  );
  const [hashtagsText, setHashtagsText] = useState('#podcasts #founders #clips');
  const [notes, setNotes] = useState(
    'Hook hits at 0:01.2 with bold centered captions.'
  );

  // Diverse instruction assets filter & copy state
  const [assetFilter, setAssetFilter] = useState<'all' | 'link' | 'image' | 'audio' | 'file'>('all');
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  const handleCopyAssetLink = (assetId: string, url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedAssetId(assetId);
      setTimeout(() => setCopiedAssetId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Resumable TUS upload state
  const [uploadProgress, setUploadProgress] =
    useState<ResumableUploadProgress | null>(null);
  const [uploadedStoragePath, setUploadedStoragePath] = useState<string | null>(
    null
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const uploadControllerRef = useRef<ResumableUploadController | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Interactive calculator state
  const [calcViews, setCalcViews] = useState(25000);

  if (!campaign) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="card-sticker bg-mint p-8 text-center space-y-4">
          <div className="flex justify-center">
            <ClappyMascot variant="lost" size={108} />
          </div>
          <h1 className="font-display text-3xl text-ink">Campaign not found</h1>
          <p className="text-sm text-muted">
            That campaign link does not match an active brief.
          </p>
          <Link href="/campaigns" className="btn-sticker btn-primary">
            <ArrowLeft weight="bold" className="h-5 w-5" />
            <span>Back to Campaigns</span>
          </Link>
        </div>
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

  const campaignAssets: InstructionAsset[] =
    campaign.instruction_assets && campaign.instruction_assets.length > 0
      ? campaign.instruction_assets
      : campaign.source_links.map((url, idx) => ({
          id: `legacy-link-${idx}`,
          type: 'link',
          title: `Raw Footage Link #${idx + 1}`,
          url,
          note: 'Primary editing source footage',
        }));

  const filteredAssets =
    assetFilter === 'all'
      ? campaignAssets
      : campaignAssets.filter((a) => a.type === assetFilter);

  const linkCount = campaignAssets.filter((a) => a.type === 'link').length;
  const imageCount = campaignAssets.filter((a) => a.type === 'image').length;
  const audioCount = campaignAssets.filter((a) => a.type === 'audio').length;
  const fileCount = campaignAssets.filter((a) => a.type === 'file').length;

  const mySubmissions = currentUser
    ? db.submissions.filter(
        (s) => s.campaign_id === campaign.id && s.editor_id === currentUser.id
      )
    : [];

  const estEarnings = calculateSubmissionEarnings({
    countedViews: calcViews,
    ratePer1kCents: campaign.rate_per_1k_cents,
    baseFeeCents: campaign.base_fee_cents,
    maxPayoutPerClipCents: campaign.max_payout_per_clip_cents,
    platformFeePercent: db.settings.platform_fee_percent,
    remainingCampaignBudgetCents: budget.remainingBudgetCents,
  });

  const handleTapSubmitButton = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setSubmitDrawerOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitError(null);
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    const objectUrl = URL.createObjectURL(file);
    setLocalBlobUrl(objectUrl);

    const controller = startResumableClipUpload({
      file,
      campaignId: campaign.id,
      editorId: currentUser?.id || 'editor-guest',
      onProgress: (p) => setUploadProgress({ ...p }),
      onSuccess: (res) => setUploadedStoragePath(res.storagePath),
      onError: (err) => setSubmitError(err.message),
    });
    uploadControllerRef.current = controller;
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
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
        storage_path:
          sourceType === 'upload'
            ? uploadedStoragePath ||
              `campaigns/${campaign.id}/${currentUser.id}/demo-clip.mp4`
            : null,
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
        `Sent "${created.file_name}"! Your preview is watermarked until the page owner picks your clip.`
      );
      setSuggestedCaption('');
      setNotes('');
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  };

  const remainingPct = Math.max(6, Math.min(100, 100 - budget.percentUsed));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-forest hover:underline"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </Link>

        {currentUser &&
          (currentUser.id === campaign.owner_id ||
            currentUser.role === 'admin') && (
            <Link
              href={`/holder/campaigns/${campaign.id}/edit`}
              className="btn-sticker btn-secondary py-2 px-4 text-xs"
            >
              <NotePencil weight="bold" className="h-4 w-4" />
              <span>Edit Campaign</span>
            </Link>
          )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8 Cols: Campaign Brief, Specs, Source Links, Submit Form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card-sticker p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border bg-mint px-3 py-0.5 text-xs font-bold text-ink">
                  {campaign.niche}
                </span>
                <CampaignStatusChip status={campaign.status} />
              </div>
              <span className="chip-sticker bg-paper text-ink">
                <Clock weight="bold" className="h-3.5 w-3.5" />
                <span>{getDaysLeftLabel(campaign.submission_deadline)}</span>
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-bold text-ink">
              {campaign.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              {campaign.platforms.map((pl) => (
                <PlatformBadge key={pl} platform={pl} />
              ))}
              {campaign.target_page_handles.map((handle) => (
                <span
                  key={handle}
                  className="rounded-full border border-border bg-sprout px-3 py-0.5 text-xs font-bold text-ink"
                >
                  Page: {handle}
                </span>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                What to Edit
              </h3>
              <p className="whitespace-pre-line text-sm text-ink leading-relaxed">
                {campaign.brief}
              </p>
            </div>

            {campaign.hook_notes && (
              <div className="rounded-xl border border-sun/50 bg-sun/20 p-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-ink">
                  First 3 Seconds (Hook Rule)
                </span>
                <p className="mt-1 text-sm font-medium text-ink">
                  {campaign.hook_notes}
                </p>
              </div>
            )}

            {/* Format Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-mint/50 p-3">
                <span className="text-xs font-medium text-muted">Aspect Ratio</span>
                <p className="mt-0.5 text-sm font-bold text-ink">
                  {campaign.aspect_ratio} Vertical
                </p>
              </div>
              <div className="rounded-xl border border-border bg-mint/50 p-3">
                <span className="text-xs font-medium text-muted">Clip Length</span>
                <p className="mt-0.5 text-sm font-bold text-ink tabular-nums">
                  {campaign.min_length_sec}s to {campaign.max_length_sec}s
                </p>
              </div>
              <div className="rounded-xl border border-border bg-mint/50 p-3">
                <span className="text-xs font-medium text-muted">Captions</span>
                <p className="mt-0.5 text-sm font-bold text-ink">
                  {campaign.captions_required ? 'Required on screen' : 'Optional'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-mint/50 p-3">
                <span className="text-xs font-medium text-muted">Limit / Editor</span>
                <p className="mt-0.5 text-sm font-bold text-ink tabular-nums">
                  Up to {campaign.max_submissions_per_editor} clips
                </p>
              </div>
            </div>

            {/* Instruction Materials & Creative Assets Hub */}
            <div className="border-t-2 border-ink pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="chip-sticker bg-sprout text-ink">
                      Instruction Materials &amp; Media
                    </span>
                    <span className="text-xs font-bold text-muted tabular-nums">
                      {campaignAssets.length} asset{campaignAssets.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-lg text-ink">
                    Footage, Reference Photos &amp; Audio Stems
                  </h3>
                  <p className="text-xs text-muted">
                    Materials provided by the Account Holder for this campaign.
                  </p>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setAssetFilter('all')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition border border-border ${
                      assetFilter === 'all'
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                    }`}
                  >
                    All ({campaignAssets.length})
                  </button>
                  {linkCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssetFilter('link')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition border border-border ${
                        assetFilter === 'link'
                          ? 'bg-sprout text-ink border-ink'
                          : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                      }`}
                    >
                      Links ({linkCount})
                    </button>
                  )}
                  {imageCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssetFilter('image')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition border border-border ${
                        assetFilter === 'image'
                          ? 'bg-sky text-ink border-ink'
                          : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                      }`}
                    >
                      Photos ({imageCount})
                    </button>
                  )}
                  {audioCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssetFilter('audio')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition border border-border ${
                        assetFilter === 'audio'
                          ? 'bg-sun text-ink border-ink'
                          : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                      }`}
                    >
                      Audio ({audioCount})
                    </button>
                  )}
                  {fileCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssetFilter('file')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition border border-border ${
                        assetFilter === 'file'
                          ? 'bg-mint text-ink border-ink'
                          : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                      }`}
                    >
                      Docs ({fileCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Assets list */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredAssets.map((asset) => {
                  const isImage = asset.type === 'image';
                  const isAudio = asset.type === 'audio';
                  const isLink = asset.type === 'link';

                  return (
                    <div
                      key={asset.id}
                      className="rounded-xl border border-border bg-paper p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`chip-sticker text-[10px] py-0.5 px-2 ${
                              isImage
                                ? 'bg-sky text-ink'
                                : isAudio
                                ? 'bg-sun text-ink'
                                : isLink
                                ? 'bg-sprout text-ink'
                                : 'bg-mint text-ink'
                            }`}
                          >
                            {isImage
                              ? 'PHOTO / STILL'
                              : isAudio
                              ? 'AUDIO STEM'
                              : isLink
                              ? 'SOURCE LINK'
                              : 'DOCUMENT'}
                          </span>

                          <div className="flex items-center gap-2">
                            {asset.file_size_bytes && (
                              <span className="text-[10px] font-semibold text-muted tabular-nums">
                                {(asset.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyAssetLink(asset.id, asset.url)}
                              className="text-muted hover:text-ink p-1 transition"
                              title="Copy URL"
                            >
                              {copiedAssetId === asset.id ? (
                                <Check weight="bold" className="h-4 w-4 text-forest" />
                              ) : (
                                <Copy weight="bold" className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-ink leading-snug">
                            {asset.title}
                          </h4>
                          {asset.file_name && (
                            <p className="text-[11px] text-muted truncate mt-0.5">
                              {asset.file_name}
                            </p>
                          )}
                        </div>

                        {/* Visual preview according to type */}
                        {isImage && (
                          <div className="rounded-lg border border-border overflow-hidden bg-mint/10">
                            <img
                              src={asset.url}
                              alt={asset.title}
                              className="w-full h-36 object-cover hover:scale-105 transition duration-300"
                            />
                          </div>
                        )}

                        {isAudio && (
                          <div className="rounded-lg border border-border bg-mint/30 p-2.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                              <SpeakerHigh weight="bold" className="h-4 w-4 text-forest shrink-0" />
                              <span>Listen to Audio Track</span>
                            </div>
                            <audio
                              controls
                              preload="none"
                              src={asset.url}
                              className="w-full h-8"
                            />
                          </div>
                        )}

                        {asset.note && (
                          <div className="rounded-lg bg-mint/60 border border-border/60 p-2.5 text-xs text-ink space-y-0.5">
                            <span className="font-extrabold text-[10px] uppercase text-muted block">
                              Usage Note
                            </span>
                            <p className="text-xs leading-relaxed">{asset.note}</p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-sticker btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
                        >
                          {isImage ? (
                            <>
                              <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                              <span>View Full Photo</span>
                            </>
                          ) : isAudio ? (
                            <>
                              <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
                              <span>Open / Download Audio</span>
                            </>
                          ) : (
                            <>
                              <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                              <span>Open Source Link</span>
                            </>
                          )}
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyAssetLink(asset.id, asset.url)}
                          className="text-xs font-semibold text-muted hover:text-ink transition"
                        >
                          {copiedAssetId === asset.id ? 'Copied' : 'Copy link'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Clip Form Panel */}
          {submitDrawerOpen && currentUser && (
            <div
              id="submit-clip-panel"
              className="card-sticker bg-mint p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                <div>
                  <span className="chip-sticker bg-sprout text-ink">
                    Private Bucket · Watermarked Preview
                  </span>
                  <h2 className="mt-1.5 font-display text-2xl text-ink">
                    Submit Your Edited Clip
                  </h2>
                </div>
                <span className="rounded-full border border-border bg-paper px-3 py-1 text-xs font-bold text-ink tabular-nums">
                  {mySubmissions.filter((s) => s.status !== 'rejected').length} /{' '}
                  {campaign.max_submissions_per_editor} clips used
                </span>
              </div>

              {submitError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-coral/40 bg-coral/15 p-4 text-sm font-bold text-ink">
                  <WarningCircle weight="bold" className="h-5 w-5 shrink-0 mt-0.5 text-coral" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-sprout/20 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <ClappyMascot variant="celebrate" size={56} />
                    <div className="space-y-1">
                      <p className="font-display text-xl font-bold text-ink">
                        Clip submitted
                      </p>
                      <p className="text-xs font-semibold text-ink">
                        {submitSuccess}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/editor/submissions')}
                    className="btn-sticker btn-secondary text-xs py-2 px-4"
                  >
                    <span>See My Submitted Clips</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSourceType('upload')}
                    className={`btn-sticker text-xs ${
                      sourceType === 'upload' ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    <UploadSimple weight="bold" className="h-4 w-4" />
                    <span>Upload Video (MP4/MOV up to 500MB)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('link')}
                    className={`btn-sticker text-xs ${
                      sourceType === 'link' ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    <LinkSimple weight="bold" className="h-4 w-4" />
                    <span>Paste Drive or Dropbox Link</span>
                  </button>
                </div>

                {sourceType === 'upload' ? (
                  <div className="rounded-xl border border-border bg-paper p-4 space-y-3">
                    <label
                      htmlFor="clip-file-input"
                      className="block text-sm font-extrabold text-ink"
                    >
                      Choose your video file (MP4 or MOV, max 500MB)
                    </label>
                    <input
                      id="clip-file-input"
                      type="file"
                      accept="video/mp4,video/quicktime,.mp4,.mov"
                      onChange={handleFileChange}
                      className="input-sticker"
                    />

                    {uploadProgress && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs font-extrabold text-ink">
                          <span>
                            {uploadProgress.status === 'paused' ||
                            uploadProgress.status === 'retrying'
                              ? "Upload paused. We'll keep going when your signal's back."
                              : uploadProgress.message}
                          </span>
                          <span className="tabular-nums">
                            {uploadProgress.percentage}%
                          </span>
                        </div>
                        <div className="progress-sticker">
                          <div
                            className="progress-sticker-fill"
                            style={{ width: `${uploadProgress.percentage}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {uploadProgress.status === 'uploading' && (
                            <>
                              <button
                                type="button"
                                onClick={() => uploadControllerRef.current?.pause()}
                                className="btn-sticker btn-secondary py-1.5 px-3 text-xs min-h-[38px]"
                              >
                                <Pause weight="bold" className="h-3.5 w-3.5" />
                                <span>Pause</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  uploadControllerRef.current?.simulateNetworkDrop()
                                }
                                className="btn-sticker btn-sun py-1.5 px-3 text-xs min-h-[38px]"
                              >
                                <WarningCircle
                                  weight="bold"
                                  className="h-3.5 w-3.5"
                                />
                                <span>Test Weak Signal Drop &amp; Auto-Retry</span>
                              </button>
                            </>
                          )}
                          {(uploadProgress.status === 'paused' ||
                            uploadProgress.status === 'retrying') && (
                            <button
                              type="button"
                              onClick={() => uploadControllerRef.current?.resume()}
                              className="btn-sticker btn-primary py-1.5 px-3 text-xs min-h-[38px]"
                            >
                              <Play weight="bold" className="h-3.5 w-3.5" />
                              <span>Resume Upload Now</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="clip-drive-link"
                      className="mb-1.5 block text-sm font-extrabold text-ink"
                    >
                      Paste your Google Drive or Dropbox video link
                    </label>
                    <input
                      id="clip-drive-link"
                      type="url"
                      required
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                      className="input-sticker"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="clip-duration"
                      className="mb-1.5 block text-sm font-extrabold text-ink"
                    >
                      Clip length in seconds ({campaign.min_length_sec}-
                      {campaign.max_length_sec}s)
                    </label>
                    <input
                      id="clip-duration"
                      type="number"
                      min={campaign.min_length_sec}
                      max={campaign.max_length_sec}
                      value={durationSec}
                      onChange={(e) => setDurationSec(Number(e.target.value))}
                      className="input-sticker tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="clip-hashtags"
                      className="mb-1.5 block text-sm font-extrabold text-ink"
                    >
                      Suggested hashtags (optional)
                    </label>
                    <input
                      id="clip-hashtags"
                      type="text"
                      value={hashtagsText}
                      onChange={(e) => setHashtagsText(e.target.value)}
                      className="input-sticker"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="clip-caption"
                    className="mb-1.5 block text-sm font-extrabold text-ink"
                  >
                    Suggested post caption (optional)
                  </label>
                  <input
                    id="clip-caption"
                    type="text"
                    value={suggestedCaption}
                    onChange={(e) => setSuggestedCaption(e.target.value)}
                    className="input-sticker"
                  />
                </div>

                <div>
                  <label
                    htmlFor="clip-notes"
                    className="mb-1.5 block text-sm font-extrabold text-ink"
                  >
                    Notes for the page owner (optional)
                  </label>
                  <textarea
                    id="clip-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-sticker"
                  />
                </div>

                <button type="submit" className="btn-sticker btn-primary w-full">
                  <CheckCircle weight="bold" className="h-5 w-5" />
                  <span>Submit Clip Now</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Rate Sticker, Remaining Budget, Calculator, Page Owner Scorecard */}
        <div className="lg:col-span-4 space-y-5">
          <div className="card-sticker p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Pay Rate
              </span>
              <span className="rounded-xl border border-emerald-500/30 bg-sprout/20 px-3 py-1 font-display text-2xl font-bold text-forest">
                {formatMoneyCents(campaign.rate_per_1k_cents, campaign.currency)} /
                1K
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-border bg-mint/50 p-3">
                <span className="text-xs font-medium text-muted">Base Pay</span>
                <p className="font-display text-xl font-bold text-ink tabular-nums">
                  {formatMoneyCents(campaign.base_fee_cents, campaign.currency)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-mint/50 p-3">
                <span className="text-xs font-medium text-muted">Max View Bonus</span>
                <p className="font-display text-xl font-bold text-ink tabular-nums">
                  {formatMoneyCents(
                    campaign.max_payout_per_clip_cents,
                    campaign.currency
                  )}
                </p>
              </div>
            </div>

            {/* Escrow Funding Guarantee */}
            <div className="rounded-xl border border-emerald-500/30 bg-sprout/20 p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <ShieldCheck weight="bold" className="h-4 w-4 text-forest shrink-0" />
                <span>Pre-Funded Escrow Pool</span>
              </div>
              <span className="font-extrabold text-forest tabular-nums">
                {formatMoneyCents(budget.fundedEscrowCents, campaign.currency)}
              </span>
            </div>

            {/* Remaining Budget Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-ink">
                <span>Remaining Campaign Budget</span>
                <span className="tabular-nums font-bold">
                  {formatMoneyCents(budget.remainingBudgetCents, campaign.currency)}
                </span>
              </div>
              <div className="progress-sticker">
                <div
                  className="progress-sticker-fill"
                  style={{ width: `${remainingPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-muted tabular-nums">
                <span>
                  Used: {formatMoneyCents(budget.accruedBudgetCents, campaign.currency)}
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
              className="btn-sticker btn-primary w-full"
            >
              <span>
                {currentUser
                  ? submitDrawerOpen
                    ? 'Form Open Below'
                    : 'Submit Edited Clip'
                  : 'Submit Clip (Sign In)'}
              </span>
            </button>

            <p className="text-center text-xs font-medium text-muted">
              {campaign.view_tracking_window_days}-day view window · Posted within{' '}
              {campaign.post_deadline_hours}h after pick
            </p>
          </div>

          {/* Payout Calculator for This Campaign */}
          <div className="card-sticker bg-mint p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
              Estimate Your Pay
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-ink">
                <label htmlFor="camp-calc-views" className="text-muted">If your clip gets:</label>
                <span className="tabular-nums font-bold">
                  {calcViews.toLocaleString()} views
                </span>
              </div>
              <input
                id="camp-calc-views"
                type="range"
                min={1000}
                max={60000}
                step={1000}
                value={calcViews}
                onChange={(e) => setCalcViews(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-sprout/20 px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-forest">
                Your Clip Pay
              </span>
              <span className="font-display text-2xl font-bold text-ink tabular-nums">
                {formatMoneyCents(estEarnings.netEarningsCents, campaign.currency)}
              </span>
            </div>
          </div>

          {/* Account Holder Scorecard */}
          <div className="card-sticker p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest">
                  Page Owner
                </span>
                <Link
                  href={`/holders/${campaign.owner_id}`}
                  className="block text-base font-bold text-ink hover:text-forest transition"
                >
                  {owner?.display_name} (@{owner?.username})
                </Link>
              </div>
              <ShieldCheck weight="bold" className="h-6 w-6 text-forest" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border bg-mint/50 p-2.5">
                <span className="font-medium text-muted">Campaigns Run</span>
                <p className="text-sm font-bold text-ink tabular-nums">
                  {holderRep.campaigns_run}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-mint/50 p-2.5">
                <span className="font-medium text-muted">Clips Picked</span>
                <p className="text-sm font-bold text-ink tabular-nums">
                  {holderRep.clips_selected}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-mint/50 p-2.5">
                <span className="font-medium text-muted">Total Paid Out</span>
                <p className="text-sm font-bold text-forest tabular-nums">
                  {formatMoneyCents(holderRep.total_paid_out_cents, 'USD')}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-mint/50 p-2.5">
                <span className="font-medium text-muted">Posted on Time</span>
                <p className="text-sm font-bold text-forest tabular-nums">
                  {holderRep.on_time_post_percent}%
                </p>
              </div>
            </div>

            {holderRep.missed_deadlines_count > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-sun/50 bg-sun/20 px-3 py-2 text-xs font-semibold text-ink">
                <WarningCircle weight="bold" className="h-4 w-4 shrink-0 text-amber-700" />
                <span>
                  {holderRep.missed_deadlines_count} late 72h post flagged
                </span>
              </div>
            )}

            <Link
              href={`/holders/${campaign.owner_id}`}
              className="block text-center text-xs font-semibold text-forest hover:underline"
            >
              See Full Page Owner Track Record &rarr;
            </Link>
          </div>

          {/* Editor's Existing Clips on This Campaign */}
          {mySubmissions.length > 0 && (
            <div className="card-sticker p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Your Clips Here ({mySubmissions.length})
              </h3>
              <div className="space-y-2">
                {mySubmissions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-mint/50 p-2.5 text-xs"
                  >
                    <span className="truncate font-extrabold text-ink max-w-[140px]">
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
