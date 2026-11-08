'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Coins,
  FolderOpen,
  Sparkle,
   Trash,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { ClappyMascot, ConfettiBurst } from '@/components/ClappyMascot';
import {
  CampaignStatusChip,
  DisputeStatusChip,
  PayoutStatusChip,
  PlatformBadge,
  SubmissionStatusChip,
} from '@/components/StatusChip';
import { CampaignCard } from '@/components/CampaignCard';
import { useWhap } from '@/context/WhapContext';

const COLOR_SWATCHES = [
  {
    name: '--paper',
    hex: '#FFFFFF',
    bgClass: 'bg-paper',
    textClass: 'text-ink',
    usage: 'Page and card background (70% surface ratio)',
  },
  {
    name: '--mint',
    hex: '#EEF9F1',
    bgClass: 'bg-mint',
    textClass: 'text-ink',
    usage: 'Section backgrounds, subtle wells, hovered table rows',
  },
  {
    name: '--sprout',
    hex: '#3DDC84',
    bgClass: 'bg-sprout',
    textClass: 'text-ink',
    usage: 'Primary buttons, highlights, selected state (ink text ONLY)',
  },
  {
    name: '--forest',
    hex: '#0F7D43',
    bgClass: 'bg-forest',
    textClass: 'text-paper',
    usage: 'Links, active nav, posted chip (white text allowed here ONLY)',
  },
  {
    name: '--ink',
    hex: '#13261B',
    bgClass: 'bg-ink',
    textClass: 'text-paper',
    usage: 'All body text, 2px borders, hard offset shadows (never pure black)',
  },
  {
    name: '--muted',
    hex: '#5B6B61',
    bgClass: 'bg-muted',
    textClass: 'text-paper',
    usage: 'Secondary labels and helper copy',
  },
  {
    name: '--sun',
    hex: '#FFD23F',
    bgClass: 'bg-sun',
    textClass: 'text-ink',
    usage: 'In review, revision requested, warnings (ink text)',
  },
  {
    name: '--sky',
    hex: '#8ED1FC',
    bgClass: 'bg-sky',
    textClass: 'text-ink',
    usage: 'Submitted status chip (ink text)',
  },
  {
    name: '--coral',
    hex: '#FF7A6B',
    bgClass: 'bg-coral',
    textClass: 'text-ink',
    usage: 'Rejected state, danger buttons, error banners (ink text ONLY)',
  },
];

export default function StyleguidePage() {
  const { db } = useWhap();
  const [confettiOn, setConfettiOn] = useState(false);
  const [demoInput, setDemoInput] = useState('https://www.tiktok.com/@apexclipspage/video/740119201');
  const sampleCampaign = db.campaigns[0];

  const triggerConfetti = () => {
    setConfettiOn(false);
    setTimeout(() => setConfettiOn(true), 20);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Header Banner */}
      <section className="card-sticker bg-mint p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <span className="chip-sticker bg-sprout text-ink">
              <Sparkle weight="bold" className="h-3.5 w-3.5" />
              <span>Sticker Sheet Design System</span>
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-ink">
              whap Visual Styleguide
            </h1>
            <p className="max-w-2xl text-base text-muted">
              Friendly, cartoony, white and green. Thick 2px ink outlines, flat colors,
              hard offset shadows, and chunky rounded shapes. Editors feel welcome;
              account holders stay organized.
            </p>
          </div>
          <ClappyMascot variant="wave" size={110} className="shrink-0" />
        </div>
      </section>

      {/* 1. Colors */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">1. Color Tokens</h2>
        <p className="text-sm text-muted">
          70% paper white, 20% greens, 10% status accents. Never put white text on sprout
          or coral. White text is only allowed on forest.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_SWATCHES.map((swatch) => (
            <div key={swatch.name} className="card-sticker overflow-hidden">
              <div
                className={`flex h-24 items-end justify-between border-b-2 border-ink p-4 ${swatch.bgClass} ${swatch.textClass}`}
              >
                <span className="font-display text-xl">{swatch.name}</span>
                <span className="rounded-full border-2 border-ink bg-paper px-2.5 py-0.5 text-xs font-extrabold text-ink tabular-nums">
                  {swatch.hex}
                </span>
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-ink">{swatch.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Typography */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">2. Typography</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-sticker p-6 space-y-4">
            <span className="chip-sticker bg-sprout text-ink">
              Display: Bagel Fat One (Never below 20px)
            </span>
            <div className="space-y-3 border-t-2 border-ink pt-4">
              <div>
                <span className="text-xs font-extrabold uppercase text-muted">
                  Hero / 40px
                </span>
                <p className="font-display text-[40px] leading-tight text-ink">
                  Your clip got picked!
                </p>
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-muted">
                  H1 / 32px
                </span>
                <p className="font-display text-[32px] leading-tight text-ink">
                  Open Clipping Campaigns
                </p>
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-muted">
                  H2 / 24px
                </span>
                <p className="font-display text-[24px] leading-tight text-ink">
                  Posted Clips &amp; View Counts
                </p>
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-muted">
                  Minimum Display / 20px (Earnings &amp; Sticker Rates)
                </span>
                <p className="font-display text-[20px] leading-tight text-forest">
                  $1.50 per 1K views · 48,200 views · $65.00 earned
                </p>
              </div>
            </div>
          </div>

          <div className="card-sticker p-6 space-y-4">
            <span className="chip-sticker bg-mint text-ink">
              UI &amp; Body: Gabarito (400 / 700 / 800)
            </span>
            <div className="space-y-3 border-t-2 border-ink pt-4">
              <div>
                <span className="text-xs font-extrabold uppercase text-muted">
                  H3 &amp; Section Labels / Gabarito 800
                </span>
                <h3 className="text-lg font-extrabold text-ink">
                  3 days left to submit · Paste the link where you posted it
                </h3>
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-muted">
                  Buttons / Gabarito 700
                </span>
                <p className="text-base font-bold text-ink">
                  Send Clip · Pick Clip · Ask for Changes · Request Payout
                </p>
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-muted">
                  Body Copy / Gabarito 400
                </span>
                <p className="text-sm font-normal text-ink">
                  Cut a 30 to 55 second vertical clip from Episode 42. Start with the
                  sharpest quote in the first 2 seconds and keep captions centered.
                </p>
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-muted">
                  Ledger &amp; Tables / Gabarito Tabular Numerals
                </span>
                <p className="text-sm font-extrabold tabular-nums text-ink">
                  +$29.75 | -$20.00 | 38,500 views | PHP 4,300.00
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Buttons & Confetti Motion */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">
          3. Sticker Buttons &amp; Motion
        </h2>
        <div className="card-sticker p-6 space-y-4">
          <p className="text-sm text-muted">
            Min height 48px, 2px solid ink border, 12px radius, 3px hard offset shadow.
            Hover lifts 1px; pressing pushes down 3px and drops the shadow to zero.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={triggerConfetti}
              className="btn-sticker btn-primary"
            >
              <CheckCircle weight="bold" className="h-5 w-5" />
              <span>Primary Button (Tap for Confetti!)</span>
              <ConfettiBurst active={confettiOn} />
            </button>

            <button type="button" className="btn-sticker btn-secondary">
              <UploadSimple weight="bold" className="h-5 w-5" />
              <span>Secondary Button</span>
            </button>

            <button type="button" className="btn-sticker btn-sun">
              <span>Revise Button (Sun)</span>
            </button>

            <button type="button" className="btn-sticker btn-danger">
              <Trash weight="bold" className="h-5 w-5" />
              <span>Danger / Reject Button</span>
            </button>

            <button type="button" disabled className="btn-sticker btn-primary">
              <Coins weight="bold" className="h-5 w-5" />
              <span>Disabled Button</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Inputs & Error Banner */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">
          4. Inputs &amp; Plain Error Messages
        </h2>
        <div className="card-sticker p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="styleguide-post-link"
              className="block text-sm font-extrabold text-ink"
            >
              Paste the link where you posted it
            </label>
            <input
              id="styleguide-post-link"
              type="url"
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              className="input-sticker"
            />
            <p className="text-xs text-muted">
              Click inside the input to see the forest border and 3px sprout focus ring.
            </p>
          </div>

          <div className="space-y-3">
            <span className="block text-sm font-extrabold text-ink">
              Network Drop / Error State
            </span>
            <div className="flex items-start gap-3 rounded-btn border-2 border-ink bg-coral p-4 text-ink shadow-btn">
              <WarningCircle weight="bold" className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-extrabold">
                  Upload paused. We&apos;ll keep going when your signal&apos;s back.
                </p>
                <p className="mt-0.5 text-xs font-bold">
                  Saved at 64%. Do not close this tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Status Chips */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">5. Status Chips</h2>
        <div className="card-sticker p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <SubmissionStatusChip status="submitted" />
            <SubmissionStatusChip status="revision_requested" />
            <SubmissionStatusChip status="resubmitted" />
            <SubmissionStatusChip status="selected" />
            <SubmissionStatusChip status="posted" />
            <SubmissionStatusChip status="paid" />
            <SubmissionStatusChip status="rejected" />
          </div>
          <div className="flex flex-wrap items-center gap-2.5 border-t-2 border-ink pt-4">
            <CampaignStatusChip status="draft" />
            <CampaignStatusChip status="open" />
            <CampaignStatusChip status="closed" />
            <CampaignStatusChip status="completed" />
            <PayoutStatusChip status="requested" />
            <PayoutStatusChip status="paid" />
            <DisputeStatusChip status="open" />
            <PlatformBadge platform="tiktok" />
            <PlatformBadge platform="ig_reels" />
            <PlatformBadge platform="youtube_shorts" />
            <PlatformBadge platform="fb_reels" />
          </div>
        </div>
      </section>

      {/* 6. Progress Bars */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">
          6. Progress Bars (12px Tall)
        </h2>
        <div className="card-sticker p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-extrabold text-ink">
              <span>Remaining campaign budget</span>
              <span className="tabular-nums">$385.50 left of $500.00</span>
            </div>
            <div className="progress-sticker">
              <div className="progress-sticker-fill" style={{ width: '77%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-extrabold text-ink">
              <span>30-day view tracking window</span>
              <span className="tabular-nums">19 days left</span>
            </div>
            <div className="progress-sticker">
              <div className="progress-sticker-fill" style={{ width: '63%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Campaign Card */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">7. Campaign Card</h2>
        <div className="max-w-xl">
          {sampleCampaign && (
            <CampaignCard
              campaign={sampleCampaign}
              submissions={db.submissions}
              ownerHandle="apexclipspage"
            />
          )}
        </div>
      </section>

      {/* 8. Original Mascot & Empty State */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">
          8. Clappy Mascot &amp; Empty State
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-sticker p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-2 rounded-btn border-2 border-ink bg-mint p-3">
              <ClappyMascot variant="wave" size={84} />
              <span className="text-xs font-extrabold text-ink">Wave (Onboarding)</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-btn border-2 border-ink bg-mint p-3">
              <ClappyMascot variant="celebrate" size={84} />
              <span className="text-xs font-extrabold text-ink">
                Celebrate (Picked!)
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-btn border-2 border-ink bg-mint p-3">
              <ClappyMascot variant="empty" size={84} />
              <span className="text-xs font-extrabold text-ink">Empty Queue</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-btn border-2 border-ink bg-mint p-3">
              <ClappyMascot variant="lost" size={84} />
              <span className="text-xs font-extrabold text-ink">404 Lost</span>
            </div>
          </div>

          <div className="card-sticker bg-mint p-6 flex flex-col items-center justify-center text-center space-y-3">
            <ClappyMascot variant="empty" size={96} />
            <h3 className="text-lg font-extrabold text-ink">
              No clips waiting in the queue!
            </h3>
            <p className="max-w-sm text-sm text-muted">
              You reviewed every clip for your pages. Take a breather or post a new
              campaign when you need fresh edits.
            </p>
            <button type="button" className="btn-sticker btn-primary">
              <FolderOpen weight="bold" className="h-5 w-5" />
              <span>Browse Open Campaigns</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
