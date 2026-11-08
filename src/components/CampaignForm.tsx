'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Campaign, CampaignStatus, CurrencyCode, PlatformId } from '@/lib/types';
import { useWhap } from '@/context/WhapContext';

interface CampaignFormProps {
  existingCampaign?: Campaign;
}

export function CampaignForm({ existingCampaign }: CampaignFormProps) {
  const router = useRouter();
  const { createCampaign, updateCampaign } = useWhap();

  const [title, setTitle] = useState(existingCampaign?.title || '');
  const [brief, setBrief] = useState(existingCampaign?.brief || '');
  const [niche, setNiche] = useState(existingCampaign?.niche || 'Podcasts');
  const [sourceLinksText, setSourceLinksText] = useState(
    existingCampaign?.source_links.join('\n') ||
      'https://drive.google.com/drive/folders/raw-podcast-4k-footage'
  );
  const [platforms, setPlatforms] = useState<PlatformId[]>(
    existingCampaign?.platforms || ['tiktok', 'ig_reels', 'youtube_shorts']
  );
  const [targetHandlesText, setTargetHandlesText] = useState(
    existingCampaign?.target_page_handles.join(', ') || '@apexclipspage'
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9' | '4:5'>(
    existingCampaign?.aspect_ratio || '9:16'
  );
  const [minLengthSec, setMinLengthSec] = useState(existingCampaign?.min_length_sec || 20);
  const [maxLengthSec, setMaxLengthSec] = useState(existingCampaign?.max_length_sec || 58);
  const [captionsRequired, setCaptionsRequired] = useState(
    existingCampaign ? existingCampaign.captions_required : true
  );
  const [hookNotes, setHookNotes] = useState(
    existingCampaign?.hook_notes ||
      'Start with the strongest contrarian hook in the first 1.5 seconds + kinetic captions.'
  );
  const [currency, setCurrency] = useState<CurrencyCode>(existingCampaign?.currency || 'USD');
  const [ratePer1kDollars, setRatePer1kDollars] = useState(
    existingCampaign ? (existingCampaign.rate_per_1k_cents / 100).toFixed(2) : '1.50'
  );
  const [baseFeeDollars, setBaseFeeDollars] = useState(
    existingCampaign ? (existingCampaign.base_fee_cents / 100).toFixed(2) : '5.00'
  );
  const [maxPayoutDollars, setMaxPayoutDollars] = useState(
    existingCampaign ? (existingCampaign.max_payout_per_clip_cents / 100).toFixed(2) : '60.00'
  );
  const [totalBudgetDollars, setTotalBudgetDollars] = useState(
    existingCampaign ? (existingCampaign.total_budget_cap_cents / 100).toFixed(2) : '500.00'
  );
  const [clipsNeeded, setClipsNeeded] = useState(existingCampaign?.clips_needed || 8);
  const [submissionDeadline, setSubmissionDeadline] = useState(
    existingCampaign
      ? existingCampaign.submission_deadline.slice(0, 10)
      : '2026-12-01'
  );
  const [trackingWindowDays, setTrackingWindowDays] = useState(
    existingCampaign?.view_tracking_window_days || 30
  );
  const [postDeadlineHours, setPostDeadlineHours] = useState(
    existingCampaign?.post_deadline_hours || 72
  );
  const [maxSubmissionsPerEditor, setMaxSubmissionsPerEditor] = useState(
    existingCampaign?.max_submissions_per_editor || 3
  );
  const [status, setStatus] = useState<CampaignStatus>(existingCampaign?.status || 'open');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const togglePlatform = (pl: PlatformId) => {
    setPlatforms((prev) =>
      prev.includes(pl) ? prev.filter((item) => item !== pl) : [...prev, pl]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const payload = {
        title,
        brief,
        niche,
        source_links: sourceLinksText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        platforms,
        target_page_handles: targetHandlesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        aspect_ratio: aspectRatio,
        min_length_sec: Number(minLengthSec),
        max_length_sec: Number(maxLengthSec),
        captions_required: captionsRequired,
        hook_notes: hookNotes,
        currency,
        rate_per_1k_cents: Math.round(Number(ratePer1kDollars) * 100),
        base_fee_cents: Math.round(Number(baseFeeDollars) * 100),
        max_payout_per_clip_cents: Math.round(Number(maxPayoutDollars) * 100),
        total_budget_cap_cents: Math.round(Number(totalBudgetDollars) * 100),
        clips_needed: Number(clipsNeeded),
        submission_deadline: new Date(submissionDeadline).toISOString(),
        view_tracking_window_days: Number(trackingWindowDays),
        post_deadline_hours: Number(postDeadlineHours),
        max_submissions_per_editor: Number(maxSubmissionsPerEditor),
        status,
      };

      if (existingCampaign) {
        const updated = updateCampaign(existingCampaign.id, payload);
        router.push(`/campaigns/${updated.id}`);
      } else {
        const created = createCampaign(payload);
        router.push(`/campaigns/${created.id}`);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-surface p-6 space-y-6"
    >
      {errorMsg && (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* 1. Core Identity & Brief */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        <div className="sm:col-span-8">
          <label className="block text-xs font-semibold text-zinc-300">Campaign Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Founder Podcast High-Retention Clips (Season 5)"
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-xs text-white"
          />
        </div>
        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-zinc-300">Niche</label>
          <input
            type="text"
            required
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Podcasts, AI & Tech, Gaming..."
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-300">
          Editing Brief &amp; Instructions
        </label>
        <textarea
          rows={3}
          required
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe pacing, caption style, B-roll density, and what moments to clip..."
          className="mt-1 w-full rounded-xl border border-white/10 bg-inset p-3 text-xs text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-300">
          Raw Source Material Links (Drive, YouTube, Dropbox · One URL per line)
        </label>
        <textarea
          rows={2}
          required
          value={sourceLinksText}
          onChange={(e) => setSourceLinksText(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-inset p-3 font-mono text-xs text-white"
        />
      </div>

      {/* 2. Target Platforms & Handles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-zinc-300">Target Platforms</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(
              [
                { id: 'tiktok', label: 'TikTok' },
                { id: 'ig_reels', label: 'IG Reels' },
                { id: 'youtube_shorts', label: 'YouTube Shorts' },
                { id: 'fb_reels', label: 'FB Reels' },
              ] as const
            ).map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => togglePlatform(pl.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  platforms.includes(pl.id)
                    ? 'border-tally-bright bg-tally/20 text-white'
                    : 'border-white/10 bg-elevated text-zinc-400'
                }`}
              >
                {pl.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-300">
            Target Page Handle(s) (comma-separated)
          </label>
          <input
            type="text"
            required
            value={targetHandlesText}
            onChange={(e) => setTargetHandlesText(e.target.value)}
            placeholder="@apexclipspage, @foundersdaily"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 font-mono text-xs text-white"
          />
        </div>
      </div>

      {/* 3. Format Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-300">Aspect Ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) =>
              setAspectRatio(e.target.value as '9:16' | '1:1' | '16:9' | '4:5')
            }
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2.5 font-mono text-xs text-white"
          >
            <option value="9:16">9:16 (Default Vertical)</option>
            <option value="4:5">4:5</option>
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-300">Min Length (sec)</label>
          <input
            type="number"
            min={5}
            value={minLengthSec}
            onChange={(e) => setMinLengthSec(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2.5 font-mono text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-300">Max Length (sec)</label>
          <input
            type="number"
            min={10}
            value={maxLengthSec}
            onChange={(e) => setMaxLengthSec(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2.5 font-mono text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-300">Captions Required</label>
          <select
            value={captionsRequired ? 'yes' : 'no'}
            onChange={(e) => setCaptionsRequired(e.target.value === 'yes')}
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2.5 text-xs text-white"
          >
            <option value="yes">Yes · Burned-In Captions</option>
            <option value="no">No · Optional</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-300">Hook Notes</label>
        <input
          type="text"
          value={hookNotes}
          onChange={(e) => setHookNotes(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-xs text-white"
        />
      </div>

      {/* 4. Payout Math & Budget Cap */}
      <div className="rounded-xl border border-tally/30 bg-elevated p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-tally-bright">
            Payout Rates &amp; Budget Cap (Stored as Integer Cents)
          </h3>
          <div className="flex rounded-lg border border-white/10 bg-inset p-0.5 text-xs">
            {(['USD', 'PHP'] as const).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className={`rounded px-2.5 py-1 font-mono font-bold ${
                  currency === cur ? 'bg-tally text-zinc-950' : 'text-zinc-400'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300">
              Rate per 1,000 Views ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={ratePer1kDollars}
              onChange={(e) => setRatePer1kDollars(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300">
              Base Fee / Selected Clip ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={baseFeeDollars}
              onChange={(e) => setBaseFeeDollars(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300">
              Max Payout / Clip ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={maxPayoutDollars}
              onChange={(e) => setMaxPayoutDollars(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300">
              Total Budget Cap ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={totalBudgetDollars}
              onChange={(e) => setTotalBudgetDollars(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* 5. Windows, Limits & Status */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300">Clips Needed</label>
          <input
            type="number"
            min={1}
            value={clipsNeeded}
            onChange={(e) => setClipsNeeded(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300">
            Submission Deadline
          </label>
          <input
            type="date"
            required
            value={submissionDeadline}
            onChange={(e) => setSubmissionDeadline(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300">
            Tracking Window (Days)
          </label>
          <input
            type="number"
            min={1}
            value={trackingWindowDays}
            onChange={(e) => setTrackingWindowDays(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300">
            Max Subs / Editor
          </label>
          <input
            type="number"
            min={1}
            value={maxSubmissionsPerEditor}
            onChange={(e) => setMaxSubmissionsPerEditor(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CampaignStatus)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 text-xs text-white"
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-tally py-3 text-sm font-extrabold text-zinc-950 transition hover:bg-tally-bright"
      >
        {existingCampaign ? 'Save Campaign Changes' : 'Publish Clipping Campaign'}
      </button>
    </form>
  );
}
