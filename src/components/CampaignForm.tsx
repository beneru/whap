'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowSquareOut,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  MusicNotes,
  Plus,
  Trash,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import {
  Campaign,
  CampaignStatus,
  CurrencyCode,
  InstructionAsset,
  InstructionAssetType,
  PlatformType,
} from '@/lib/types';

interface CampaignFormProps {
  existingCampaign?: Campaign;
}

const ALL_PLATFORMS: { value: PlatformType; label: string }[] = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'ig_reels', label: 'IG Reels' },
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
  { value: 'fb_reels', label: 'FB Reels' },
];

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CampaignForm({ existingCampaign }: CampaignFormProps) {
  const router = useRouter();
  const { createCampaign, updateCampaign } = useWhap();

  const [title, setTitle] = useState(
    existingCampaign?.title ?? 'Founder Podcast Cutdowns (Batch 5)'
  );
  const [niche, setNiche] = useState(existingCampaign?.niche ?? 'Podcasts');
  const [brief, setBrief] = useState(
    existingCampaign?.brief ??
      'Cut 30 to 55 second vertical clips from our latest podcast episode. Open with the sharpest statement in the first 2 seconds and keep captions easy to read.'
  );

  // Diverse instruction assets state (links, photos, audio, files)
  const [instructionAssets, setInstructionAssets] = useState<InstructionAsset[]>(() => {
    if (existingCampaign?.instruction_assets && existingCampaign.instruction_assets.length > 0) {
      return existingCampaign.instruction_assets;
    }
    if (existingCampaign?.source_links && existingCampaign.source_links.length > 0) {
      return existingCampaign.source_links.map((link, idx) => ({
        id: `init-asset-${idx}-${Date.now()}`,
        type: 'link' as InstructionAssetType,
        title: `Footage & Source Link #${idx + 1}`,
        url: link,
        note: 'Primary editing source footage',
      }));
    }
    return [
      {
        id: 'init-asset-1',
        type: 'link' as InstructionAssetType,
        title: 'Podcast Raw 4K Multicam (Google Drive)',
        url: 'https://drive.google.com/drive/folders/raw-podcast-ep45',
        note: 'Episode starts at 04:12. Pick the most controversial 45 seconds.',
      },
      {
        id: 'init-asset-2',
        type: 'image' as InstructionAssetType,
        title: 'Host & Guest Cover Still (Reference)',
        url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
        file_name: 'cover-reference.jpg',
        note: 'Match color grade to this studio reference photo.',
      },
    ];
  });

  // State for new asset builder
  const [newAssetType, setNewAssetType] = useState<InstructionAssetType>('link');
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetNote, setNewAssetNote] = useState('');
  const [newAssetFileName, setNewAssetFileName] = useState('');
  const [newAssetFileSize, setNewAssetFileSize] = useState<number | undefined>(undefined);
  const [assetDraftError, setAssetDraftError] = useState<string | null>(null);

  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  const [platforms, setPlatforms] = useState<PlatformType[]>(
    existingCampaign?.platforms ?? ['tiktok', 'ig_reels', 'youtube_shorts']
  );
  const [targetHandlesText, setTargetHandlesText] = useState(
    existingCampaign?.target_page_handles.join(', ') ?? '@apexclipspage'
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9' | '4:5'>(
    existingCampaign?.aspect_ratio ?? '9:16'
  );
  const [minLengthSec, setMinLengthSec] = useState(
    existingCampaign?.min_length_sec ?? 20
  );
  const [maxLengthSec, setMaxLengthSec] = useState(
    existingCampaign?.max_length_sec ?? 58
  );
  const [captionsRequired, setCaptionsRequired] = useState(
    existingCampaign?.captions_required ?? true
  );
  const [hookNotes, setHookNotes] = useState(
    existingCampaign?.hook_notes ??
      'Put a clean headline banner in the first 2 seconds. Cut dead air.'
  );

  const [currency, setCurrency] = useState<CurrencyCode>(
    existingCampaign?.currency ?? 'USD'
  );
  const [ratePer1kDollars, setRatePer1kDollars] = useState(
    existingCampaign ? (existingCampaign.rate_per_1k_cents / 100).toFixed(2) : '1.50'
  );
  const [baseFeeDollars, setBaseFeeDollars] = useState(
    existingCampaign ? (existingCampaign.base_fee_cents / 100).toFixed(2) : '5.00'
  );
  const [maxPayoutDollars, setMaxPayoutDollars] = useState(
    existingCampaign
      ? (existingCampaign.max_payout_per_clip_cents / 100).toFixed(2)
      : '60.00'
  );
  const [budgetCapDollars, setBudgetCapDollars] = useState(
    existingCampaign
      ? (existingCampaign.total_budget_cap_cents / 100).toFixed(2)
      : '500.00'
  );

  const [clipsNeeded, setClipsNeeded] = useState(
    existingCampaign?.clips_needed ?? 8
  );
  const [submissionDeadline, setSubmissionDeadline] = useState(
    existingCampaign
      ? existingCampaign.submission_deadline.slice(0, 10)
      : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [trackingWindowDays, setTrackingWindowDays] = useState(
    existingCampaign?.view_tracking_window_days ?? 30
  );
  const [postDeadlineHours, setPostDeadlineHours] = useState(
    existingCampaign?.post_deadline_hours ?? 72
  );
  const [maxSubmissionsPerEditor, setMaxSubmissionsPerEditor] = useState(
    existingCampaign?.max_submissions_per_editor ?? 3
  );
  const [status, setStatus] = useState<CampaignStatus>(
    existingCampaign?.status ?? 'open'
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const togglePlatform = (pl: PlatformType) => {
    setPlatforms((prev) =>
      prev.includes(pl) ? prev.filter((item) => item !== pl) : [...prev, pl]
    );
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssetDraftError(null);
    if (!file.type.startsWith('image/')) {
      setAssetDraftError('Please choose a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setAssetDraftError('Image file is too large (maximum 15MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setNewAssetUrl(result);
      setNewAssetFileName(file.name);
      setNewAssetFileSize(file.size);
      if (!newAssetTitle) {
        setNewAssetTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.onerror = () => {
      setAssetDraftError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssetDraftError(null);
    if (!file.type.startsWith('audio/')) {
      setAssetDraftError('Please choose a valid audio file (MP3, WAV, AAC, M4A).');
      return;
    }
    if (file.size > 35 * 1024 * 1024) {
      setAssetDraftError('Audio file is too large (maximum 35MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setNewAssetUrl(result);
      setNewAssetFileName(file.name);
      setNewAssetFileSize(file.size);
      if (!newAssetTitle) {
        setNewAssetTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.onerror = () => {
      setAssetDraftError('Failed to read audio file.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddAsset = () => {
    setAssetDraftError(null);
    const trimmedTitle = newAssetTitle.trim();
    const trimmedUrl = newAssetUrl.trim();

    if (!trimmedTitle) {
      setAssetDraftError('Please enter a descriptive title for this instruction asset.');
      return;
    }
    if (!trimmedUrl) {
      setAssetDraftError('Please upload a file or enter a valid URL/link.');
      return;
    }

    const newAsset: InstructionAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: newAssetType,
      title: trimmedTitle,
      url: trimmedUrl,
      file_name: newAssetFileName.trim() || undefined,
      file_size_bytes: newAssetFileSize,
      note: newAssetNote.trim() || undefined,
    };

    setInstructionAssets((prev) => [...prev, newAsset]);

    // Reset draft fields
    setNewAssetTitle('');
    setNewAssetUrl('');
    setNewAssetNote('');
    setNewAssetFileName('');
    setNewAssetFileSize(undefined);
    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
  };

  const handleRemoveAsset = (assetId: string) => {
    setInstructionAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (instructionAssets.length === 0) {
        setErrorMsg('Please attach at least 1 instruction asset (link, photo, or audio) for editors.');
        return;
      }

      const source_links = instructionAssets.map((a) => a.url);
      const target_page_handles = targetHandlesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title,
        brief,
        niche,
        source_links,
        instruction_assets: instructionAssets,
        platforms,
        target_page_handles,
        aspect_ratio: aspectRatio,
        min_length_sec: Number(minLengthSec),
        max_length_sec: Number(maxLengthSec),
        captions_required: captionsRequired,
        hook_notes: hookNotes,
        currency,
        rate_per_1k_cents: Math.round(Number(ratePer1kDollars) * 100),
        base_fee_cents: Math.round(Number(baseFeeDollars) * 100),
        max_payout_per_clip_cents: Math.round(Number(maxPayoutDollars) * 100),
        total_budget_cap_cents: Math.round(Number(budgetCapDollars) * 100),
        clips_needed: Number(clipsNeeded),
        submission_deadline: new Date(submissionDeadline).toISOString(),
        view_tracking_window_days: Number(trackingWindowDays),
        post_deadline_hours: Number(postDeadlineHours),
        max_submissions_per_editor: Number(maxSubmissionsPerEditor),
        status,
      };

      if (existingCampaign) {
        updateCampaign(existingCampaign.id, payload);
        router.push(`/campaigns/${existingCampaign.id}`);
      } else {
        const created = createCampaign(payload);
        router.push(`/campaigns/${created.id}`);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-sticker p-6 space-y-6">
      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-xl border border-coral/40 bg-coral/15 p-4 text-sm font-bold text-ink">
          <WarningCircle weight="bold" className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="camp-title"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Campaign title
          </label>
          <input
            id="camp-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-sticker"
          />
        </div>

        <div>
          <label
            htmlFor="camp-niche"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Niche
          </label>
          <input
            id="camp-niche"
            type="text"
            required
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="input-sticker"
          />
        </div>

        <div>
          <label
            htmlFor="camp-handles"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Your page handle(s) (comma separated)
          </label>
          <input
            id="camp-handles"
            type="text"
            required
            value={targetHandlesText}
            onChange={(e) => setTargetHandlesText(e.target.value)}
            className="input-sticker"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="camp-brief"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Brief &amp; editing instructions
          </label>
          <textarea
            id="camp-brief"
            rows={3}
            required
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className="input-sticker"
          />
        </div>

        {/* Diverse Instruction Materials & Assets Studio */}
        <div className="sm:col-span-2 rounded-2xl border-2 border-ink bg-mint/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-ink pb-3">
            <div>
              <span className="chip-sticker bg-sprout text-ink">
                Instruction Materials &amp; Media
              </span>
              <h3 className="mt-1 font-display text-lg text-ink">
                Upload Links, Photos &amp; Audio for Editors
              </h3>
              <p className="text-xs text-muted">
                Supply footage links, photo references, logo overlays, or audio beds for editors to use.
              </p>
            </div>
            <span className="self-start sm:self-auto rounded-full border border-border bg-paper px-3 py-1 text-xs font-bold text-ink tabular-nums">
              {instructionAssets.length} asset{instructionAssets.length === 1 ? '' : 's'} attached
            </span>
          </div>

          {/* Asset Creator Card */}
          <div className="rounded-xl border border-border bg-paper p-4 space-y-3">
            <span className="block text-xs font-extrabold uppercase text-ink">
              Attach New Instruction Asset
            </span>

            {/* Type tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewAssetType('link');
                  setAssetDraftError(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition border border-border ${
                  newAssetType === 'link'
                    ? 'bg-sprout text-ink border-ink'
                    : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                }`}
              >
                <LinkIcon weight="bold" className="h-4 w-4" />
                <span>Web Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewAssetType('image');
                  setAssetDraftError(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition border border-border ${
                  newAssetType === 'image'
                    ? 'bg-sprout text-ink border-ink'
                    : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                }`}
              >
                <ImageIcon weight="bold" className="h-4 w-4" />
                <span>Photo / Graphic</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewAssetType('audio');
                  setAssetDraftError(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition border border-border ${
                  newAssetType === 'audio'
                    ? 'bg-sprout text-ink border-ink'
                    : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                }`}
              >
                <MusicNotes weight="bold" className="h-4 w-4" />
                <span>Audio Track</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewAssetType('file');
                  setAssetDraftError(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition border border-border ${
                  newAssetType === 'file'
                    ? 'bg-sprout text-ink border-ink'
                    : 'bg-paper text-muted hover:text-ink hover:bg-mint'
                }`}
              >
                <FileText weight="bold" className="h-4 w-4" />
                <span>Document / Guide</span>
              </button>
            </div>

            {assetDraftError && (
              <div className="flex items-center gap-2 rounded-lg border border-coral/50 bg-coral/15 px-3 py-2 text-xs font-bold text-ink">
                <WarningCircle weight="bold" className="h-4 w-4 text-coral shrink-0" />
                <span>{assetDraftError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">
                  Asset Title
                </label>
                <input
                  type="text"
                  placeholder={
                    newAssetType === 'link'
                      ? 'e.g. 4K Raw Multicam Footage (Google Drive)'
                      : newAssetType === 'image'
                      ? 'e.g. Brand Logo Overlay (Transparent PNG)'
                      : newAssetType === 'audio'
                      ? 'e.g. High-Energy Lo-Fi Intro Beat'
                      : 'e.g. Creator Brand Style Sheet & Captions'
                  }
                  value={newAssetTitle}
                  onChange={(e) => setNewAssetTitle(e.target.value)}
                  className="input-sticker text-xs"
                />
              </div>

              {/* Source/Upload Field based on type */}
              <div>
                {newAssetType === 'link' && (
                  <>
                    <label className="mb-1 block text-xs font-bold text-ink">
                      Web URL (Drive, Dropbox, YouTube, Loom)
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={newAssetUrl}
                      onChange={(e) => setNewAssetUrl(e.target.value)}
                      className="input-sticker text-xs"
                    />
                  </>
                )}

                {newAssetType === 'image' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-ink">
                      Upload Photo or Provide Image URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={imageFileInputRef}
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => imageFileInputRef.current?.click()}
                        className="btn-sticker btn-secondary py-1.5 px-3 text-xs"
                      >
                        <UploadSimple weight="bold" className="h-4 w-4" />
                        <span>Upload Photo</span>
                      </button>
                      <input
                        type="text"
                        placeholder="Or paste image URL (https://...)"
                        value={newAssetUrl.startsWith('data:') ? '' : newAssetUrl}
                        onChange={(e) => {
                          setNewAssetUrl(e.target.value);
                          setNewAssetFileName('');
                          setNewAssetFileSize(undefined);
                        }}
                        className="input-sticker text-xs flex-1"
                      />
                    </div>
                  </div>
                )}

                {newAssetType === 'audio' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-ink">
                      Upload Audio File or Audio Stream Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={audioFileInputRef}
                        accept="audio/*"
                        onChange={handleAudioFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => audioFileInputRef.current?.click()}
                        className="btn-sticker btn-secondary py-1.5 px-3 text-xs"
                      >
                        <UploadSimple weight="bold" className="h-4 w-4" />
                        <span>Upload Audio</span>
                      </button>
                      <input
                        type="text"
                        placeholder="Or paste audio URL (MP3/WAV)"
                        value={newAssetUrl.startsWith('data:') ? '' : newAssetUrl}
                        onChange={(e) => {
                          setNewAssetUrl(e.target.value);
                          setNewAssetFileName('');
                          setNewAssetFileSize(undefined);
                        }}
                        className="input-sticker text-xs flex-1"
                      />
                    </div>
                  </div>
                )}

                {newAssetType === 'file' && (
                  <>
                    <label className="mb-1 block text-xs font-bold text-ink">
                      File / Document URL (PDF, Docs, Notion)
                    </label>
                    <input
                      type="url"
                      placeholder="https://docs.google.com/..."
                      value={newAssetUrl}
                      onChange={(e) => setNewAssetUrl(e.target.value)}
                      className="input-sticker text-xs"
                    />
                  </>
                )}
              </div>

              {/* Live Preview for Photo / Audio if URL is loaded */}
              {newAssetType === 'image' && newAssetUrl && (
                <div className="sm:col-span-2 rounded-xl border border-border bg-mint/30 p-2.5 flex items-center gap-3">
                  <img
                    src={newAssetUrl}
                    alt="Upload preview"
                    className="h-16 w-16 object-cover rounded-lg border border-border bg-paper"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-ink">
                      {newAssetFileName || 'Image preview ready'}
                    </p>
                    {newAssetFileSize && (
                      <p className="text-muted tabular-nums">
                        {formatBytes(newAssetFileSize)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {newAssetType === 'audio' && newAssetUrl && (
                <div className="sm:col-span-2 rounded-xl border border-border bg-mint/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink">
                      {newAssetFileName || 'Audio track loaded'}
                    </span>
                    {newAssetFileSize && (
                      <span className="text-muted tabular-nums">
                        {formatBytes(newAssetFileSize)}
                      </span>
                    )}
                  </div>
                  <audio controls src={newAssetUrl} className="w-full h-8" />
                </div>
              )}

              {/* Note for editor */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-ink">
                  Usage Instructions for Editors (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Place logo in top-right corner with 80% opacity, duck BGM under speech."
                  value={newAssetNote}
                  onChange={(e) => setNewAssetNote(e.target.value)}
                  className="input-sticker text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddAsset}
                className="btn-sticker btn-primary py-2 px-4 text-xs"
              >
                <Plus weight="bold" className="h-4 w-4" />
                <span>Attach Asset</span>
              </button>
            </div>
          </div>

          {/* Attached Assets List */}
          <div className="space-y-2">
            <span className="block text-xs font-extrabold uppercase text-ink">
              Attached Campaign Assets ({instructionAssets.length})
            </span>

            {instructionAssets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-paper/60 p-4 text-center text-xs text-muted">
                No instruction assets attached yet. Add footage links, photos, or audio beds above so editors have creative materials.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {instructionAssets.map((asset) => {
                  const isImage = asset.type === 'image';
                  const isAudio = asset.type === 'audio';
                  const isLink = asset.type === 'link';

                  return (
                    <div
                      key={asset.id}
                      className="rounded-xl border border-border bg-paper p-3 space-y-2 relative flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
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
                              {asset.type.toUpperCase()}
                            </span>
                            {asset.file_size_bytes && (
                              <span className="text-[10px] font-semibold text-muted tabular-nums">
                                {formatBytes(asset.file_size_bytes)}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(asset.id)}
                            className="text-muted hover:text-coral transition p-1"
                            title="Remove asset"
                          >
                            <Trash weight="bold" className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="font-bold text-sm text-ink line-clamp-1">
                          {asset.title}
                        </p>

                        {/* Media preview */}
                        {isImage && (
                          <div className="mt-1">
                            <img
                              src={asset.url}
                              alt={asset.title}
                              className="h-24 w-full object-cover rounded-lg border border-border bg-mint/20"
                            />
                          </div>
                        )}

                        {isAudio && (
                          <div className="mt-1">
                            <audio controls src={asset.url} className="w-full h-8" />
                          </div>
                        )}

                        {!isImage && !isAudio && (
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline truncate max-w-full"
                          >
                            <span className="truncate">{asset.url}</span>
                            <ArrowSquareOut weight="bold" className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        )}

                        {asset.note && (
                          <div className="rounded-lg bg-mint/60 border border-border/50 p-2 text-xs text-ink space-y-0.5">
                            <span className="font-extrabold text-[10px] uppercase text-muted block">
                              Editor Instruction
                            </span>
                            <p className="text-xs">{asset.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="sm:col-span-2 space-y-2">
          <span className="block text-sm font-extrabold text-ink">
            Platforms where you will post
          </span>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((pl) => {
              const active = platforms.includes(pl.value);
              return (
                <button
                  key={pl.value}
                  type="button"
                  onClick={() => togglePlatform(pl.value)}
                  className={`btn-sticker py-2 px-4 text-xs ${
                    active ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {pl.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Format Specs */}
      <div className="border-t-2 border-ink pt-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label
            htmlFor="camp-aspect"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Aspect ratio
          </label>
          <select
            id="camp-aspect"
            value={aspectRatio}
            onChange={(e) =>
              setAspectRatio(e.target.value as '9:16' | '1:1' | '16:9')
            }
            className="input-sticker"
          >
            <option value="9:16">9:16 Vertical</option>
            <option value="1:1">1:1 Square</option>
            <option value="16:9">16:9 Horizontal</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="camp-min-sec"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Min length (sec)
          </label>
          <input
            id="camp-min-sec"
            type="number"
            value={minLengthSec}
            onChange={(e) => setMinLengthSec(Number(e.target.value))}
            className="input-sticker tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="camp-max-sec"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Max length (sec)
          </label>
          <input
            id="camp-max-sec"
            type="number"
            value={maxLengthSec}
            onChange={(e) => setMaxLengthSec(Number(e.target.value))}
            className="input-sticker tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="camp-captions"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Captions needed?
          </label>
          <select
            id="camp-captions"
            value={captionsRequired ? 'yes' : 'no'}
            onChange={(e) => setCaptionsRequired(e.target.value === 'yes')}
            className="input-sticker"
          >
            <option value="yes">Yes, required</option>
            <option value="no">Optional</option>
          </select>
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="camp-hook"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            First 3-second hook notes
          </label>
          <input
            id="camp-hook"
            type="text"
            value={hookNotes}
            onChange={(e) => setHookNotes(e.target.value)}
            className="input-sticker"
          />
        </div>
      </div>

      {/* Pay & Budget */}
      <div className="border-t-2 border-ink pt-5 grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div>
          <label
            htmlFor="camp-currency"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Currency
          </label>
          <select
            id="camp-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="input-sticker"
          >
            <option value="USD">USD ($)</option>
            <option value="PHP">PHP (₱)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="camp-rate"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Rate / 1K views
          </label>
          <input
            id="camp-rate"
            type="number"
            step="0.01"
            value={ratePer1kDollars}
            onChange={(e) => setRatePer1kDollars(e.target.value)}
            className="input-sticker tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="camp-base"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Base fee / clip
          </label>
          <input
            id="camp-base"
            type="number"
            step="0.01"
            value={baseFeeDollars}
            onChange={(e) => setBaseFeeDollars(e.target.value)}
            className="input-sticker tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="camp-max-clip"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Max bonus / clip
          </label>
          <input
            id="camp-max-clip"
            type="number"
            step="0.01"
            value={maxPayoutDollars}
            onChange={(e) => setMaxPayoutDollars(e.target.value)}
            className="input-sticker tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="camp-budget"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Total budget cap
          </label>
          <input
            id="camp-budget"
            type="number"
            step="0.01"
            value={budgetCapDollars}
            onChange={(e) => setBudgetCapDollars(e.target.value)}
            className="input-sticker tabular-nums"
          />
        </div>
      </div>

      {/* Schedule & Limits */}
      <div className="border-t-2 border-ink pt-5 grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div>
          <label
            htmlFor="camp-clips-needed"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Clips needed
          </label>
          <input
            id="camp-clips-needed"
            type="number"
            value={clipsNeeded}
            onChange={(e) => setClipsNeeded(Number(e.target.value))}
            className="input-sticker tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="camp-deadline"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Deadline
          </label>
          <input
            id="camp-deadline"
            type="date"
            value={submissionDeadline}
            onChange={(e) => setSubmissionDeadline(e.target.value)}
            className="input-sticker"
          />
        </div>

        <div>
          <label
            htmlFor="camp-window"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            View window (days)
          </label>
          <input
            id="camp-window"
            type="number"
            value={trackingWindowDays}
            onChange={(e) => setTrackingWindowDays(Number(e.target.value))}
            className="input-sticker tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="camp-max-ed"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Max clips / editor
          </label>
          <input
            id="camp-max-ed"
            type="number"
            value={maxSubmissionsPerEditor}
            onChange={(e) => setMaxSubmissionsPerEditor(Number(e.target.value))}
            className="input-sticker tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="camp-status"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Campaign status
          </label>
          <select
            id="camp-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CampaignStatus)}
            className="input-sticker"
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t-2 border-ink pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-sticker btn-secondary"
        >
          Cancel
        </button>
        <button type="submit" className="btn-sticker btn-primary">
          <CheckCircle weight="bold" className="h-5 w-5" />
          <span>{existingCampaign ? 'Save Campaign Changes' : 'Post Campaign'}</span>
        </button>
      </div>
    </form>
  );
}
