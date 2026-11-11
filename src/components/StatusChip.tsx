'use client';

import React from 'react';
import {
  ArrowsClockwise,
  Broadcast,
  CheckCircle,
  Clock,
  Coins,
  FilmSlate,
  InstagramLogo,
  LockKey,
  NotePencil,
  PaperPlaneTilt,
  PlayCircle,
  TiktokLogo,
  WarningCircle,
  XCircle,
  YoutubeLogo,
} from '@phosphor-icons/react';
import {
  CampaignStatus,
  DisputeStatus,
  PayoutStatus,
  PlatformType,
  SubmissionStatus,
} from '@/lib/types';

/**
 * Status chips: pill shape, 2px ink border, Phosphor bold icon + label.
 * submitted = sky (#8ED1FC, ink text)
 * revision_requested / resubmitted = sun (#FFD23F, ink text)
 * selected = sprout (#3DDC84, ink text)
 * posted = forest (#0F7D43, white text)
 * paid = sprout (#3DDC84, ink text + coin icon)
 * rejected = coral (#FF7A6B, ink text)
 */
const SUBMISSION_CONFIG: Record<
  SubmissionStatus,
  {
    label: string;
    classes: string;
    Icon: React.ElementType;
  }
> = {
  submitted: {
    label: 'Submitted',
    classes: 'bg-sky-50 text-sky-700 border-sky-200',
    Icon: PaperPlaneTilt,
  },
  revision_requested: {
    label: 'Needs Revision',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: NotePencil,
  },
  resubmitted: {
    label: 'Resubmitted',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: ArrowsClockwise,
  },
  selected: {
    label: 'Selected',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Icon: CheckCircle,
  },
  posted: {
    label: 'Posted Live',
    classes: 'bg-forest text-white border-forest',
    Icon: Broadcast,
  },
  paid: {
    label: 'Paid',
    classes: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    Icon: Coins,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    Icon: XCircle,
  },
};

export function SubmissionStatusChip({ status }: { status: SubmissionStatus }) {
  const cfg = SUBMISSION_CONFIG[status] ?? SUBMISSION_CONFIG.submitted;
  const Icon = cfg.Icon;
  return (
    <span className={`chip-sticker ${cfg.classes}`}>
      <Icon weight="bold" className="h-3.5 w-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}

const CAMPAIGN_CONFIG: Record<
  CampaignStatus,
  { label: string; classes: string; Icon: React.ElementType }
> = {
  draft: {
    label: 'Draft',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    Icon: NotePencil,
  },
  open: {
    label: 'Open',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Icon: PlayCircle,
  },
  closed: {
    label: 'Closed',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: LockKey,
  },
  completed: {
    label: 'Completed',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    Icon: CheckCircle,
  },
};

export function CampaignStatusChip({ status }: { status: CampaignStatus }) {
  const cfg = CAMPAIGN_CONFIG[status] ?? CAMPAIGN_CONFIG.open;
  const Icon = cfg.Icon;
  return (
    <span className={`chip-sticker ${cfg.classes}`}>
      <Icon weight="bold" className="h-3.5 w-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}

const PLATFORM_LABELS: Record<
  PlatformType,
  { label: string; Icon: React.ElementType }
> = {
  tiktok: { label: 'TikTok', Icon: TiktokLogo },
  ig_reels: { label: 'IG Reels', Icon: InstagramLogo },
  youtube_shorts: { label: 'Shorts', Icon: YoutubeLogo },
  fb_reels: { label: 'FB Reels', Icon: FilmSlate },
};

export function PlatformBadge({ platform }: { platform: PlatformType }) {
  const cfg = PLATFORM_LABELS[platform] ?? {
    label: platform,
    Icon: FilmSlate,
  };
  const Icon = cfg.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-mint px-2.5 py-0.5 text-xs font-semibold text-ink">
      <Icon weight="bold" className="h-3.5 w-3.5 shrink-0 text-forest" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function PayoutStatusChip({ status }: { status: PayoutStatus }) {
  if (status === 'paid') {
    return (
      <span className="chip-sticker bg-emerald-50 text-emerald-800 border-emerald-300">
        <Coins weight="bold" className="h-3.5 w-3.5 shrink-0" />
        <span>Paid</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="chip-sticker bg-rose-50 text-rose-700 border-rose-200">
        <XCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="chip-sticker bg-amber-50 text-amber-800 border-amber-200">
      <Clock weight="bold" className="h-3.5 w-3.5 shrink-0" />
      <span>Requested</span>
    </span>
  );
}

export function DisputeStatusChip({ status }: { status: DisputeStatus }) {
  if (status === 'open') {
    return (
      <span className="chip-sticker bg-amber-50 text-amber-800 border-amber-200">
        <WarningCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
        <span>Open Dispute</span>
      </span>
    );
  }
  if (status === 'resolved_overturned') {
    return (
      <span className="chip-sticker bg-emerald-50 text-emerald-800 border-emerald-300">
        <CheckCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
        <span>Updated Views</span>
      </span>
    );
  }
  return (
    <span className="chip-sticker bg-zinc-100 text-zinc-700 border-zinc-200">
      <CheckCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
      <span>Kept Original</span>
    </span>
  );
}
