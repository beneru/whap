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
    classes: 'bg-sky text-ink',
    Icon: PaperPlaneTilt,
  },
  revision_requested: {
    label: 'Needs Revision',
    classes: 'bg-sun text-ink',
    Icon: NotePencil,
  },
  resubmitted: {
    label: 'Resubmitted',
    classes: 'bg-sun text-ink',
    Icon: ArrowsClockwise,
  },
  selected: {
    label: 'Selected',
    classes: 'bg-sprout text-ink',
    Icon: CheckCircle,
  },
  posted: {
    label: 'Posted Live',
    classes: 'bg-forest text-paper',
    Icon: Broadcast,
  },
  paid: {
    label: 'Paid',
    classes: 'bg-sprout text-ink',
    Icon: Coins,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-coral text-ink',
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
    classes: 'bg-mint text-ink',
    Icon: NotePencil,
  },
  open: {
    label: 'Open',
    classes: 'bg-sprout text-ink',
    Icon: PlayCircle,
  },
  closed: {
    label: 'Closed',
    classes: 'bg-sun text-ink',
    Icon: LockKey,
  },
  completed: {
    label: 'Completed',
    classes: 'bg-forest text-paper',
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
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mint px-2.5 py-0.5 text-xs font-extrabold text-ink">
      <Icon weight="bold" className="h-3.5 w-3.5 shrink-0 text-ink" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function PayoutStatusChip({ status }: { status: PayoutStatus }) {
  if (status === 'paid') {
    return (
      <span className="chip-sticker bg-sprout text-ink">
        <Coins weight="bold" className="h-3.5 w-3.5 shrink-0" />
        <span>Paid</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="chip-sticker bg-coral text-ink">
        <XCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="chip-sticker bg-sun text-ink">
      <Clock weight="bold" className="h-3.5 w-3.5 shrink-0" />
      <span>Requested</span>
    </span>
  );
}

export function DisputeStatusChip({ status }: { status: DisputeStatus }) {
  if (status === 'open') {
    return (
      <span className="chip-sticker bg-sun text-ink">
        <WarningCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
        <span>Open Dispute</span>
      </span>
    );
  }
  if (status === 'resolved_overturned') {
    return (
      <span className="chip-sticker bg-sprout text-ink">
        <CheckCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
        <span>Updated Views</span>
      </span>
    );
  }
  return (
    <span className="chip-sticker bg-mint text-ink">
      <CheckCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
      <span>Kept Original</span>
    </span>
  );
}
