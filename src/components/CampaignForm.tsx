'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { Campaign, CampaignStatus, CurrencyCode, PlatformType } from '@/lib/types';

interface CampaignFormProps {
  existingCampaign?: Campaign;
}

const ALL_PLATFORMS: { value: PlatformType; label: string }[] = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'ig_reels', label: 'IG Reels' },
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
  { value: 'fb_reels', label: 'FB Reels' },
];

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
  const [sourceLinksText, setSourceLinksText] = useState(
    existingCampaign?.source_links.join('\n') ??
      'https://drive.google.com/drive/folders/raw-podcast-ep45'
  );
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const source_links = sourceLinksText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const target_page_handles = targetHandlesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title,
        brief,
        niche,
        source_links,
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
        <div className="flex items-start gap-2.5 rounded-btn border-2 border-ink bg-coral p-4 text-sm font-extrabold text-ink">
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

        <div className="sm:col-span-2">
          <label
            htmlFor="camp-sources"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Source footage links (Drive, YouTube, Dropbox: one per line)
          </label>
          <textarea
            id="camp-sources"
            rows={2}
            required
            value={sourceLinksText}
            onChange={(e) => setSourceLinksText(e.target.value)}
            className="input-sticker"
          />
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
