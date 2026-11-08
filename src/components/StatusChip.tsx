import React from 'react';
import { CampaignStatus, DisputeStatus, PayoutRequestStatus, PlatformId, SubmissionStatus } from '@/lib/types';

const SUBMISSION_STATUS_META: Record<
  SubmissionStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  submitted: {
    label: 'Submitted · In Queue',
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
    border: 'border-sky-500/25',
    dot: 'bg-sky-400',
  },
  revision_requested: {
    label: 'Revision Requested',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  resubmitted: {
    label: 'Resubmitted · Ready',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  selected: {
    label: 'Selected · Rate Locked',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/35',
    dot: 'bg-emerald-400',
  },
  posted: {
    label: 'Posted · Tracking Views',
    bg: 'bg-tally/15',
    text: 'text-tally-bright',
    border: 'border-tally/40',
    dot: 'bg-tally-bright animate-pulse',
  },
  paid: {
    label: 'Paid · Settled',
    bg: 'bg-emerald-400/20',
    text: 'text-emerald-200',
    border: 'border-emerald-400/40',
    dot: 'bg-emerald-300',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-500/10',
    text: 'text-red-300',
    border: 'border-red-500/25',
    dot: 'bg-red-400',
  },
};

export function SubmissionStatusChip({ status }: { status: SubmissionStatus }) {
  const meta = SUBMISSION_STATUS_META[status] || SUBMISSION_STATUS_META.submitted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight ${meta.bg} ${meta.text} ${meta.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function CampaignStatusChip({ status }: { status: CampaignStatus }) {
  const styles: Record<CampaignStatus, string> = {
    draft: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    open: 'bg-tally/15 text-tally-bright border-tally/35',
    closed: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    completed: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      {status === 'open' && <span className="h-1.5 w-1.5 rounded-full bg-tally-bright animate-ping" />}
      {status}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: PlatformId }) {
  const labels: Record<PlatformId, { name: string; color: string }> = {
    tiktok: { name: 'TikTok', color: 'border-pink-500/30 bg-pink-500/10 text-pink-200' },
    ig_reels: { name: 'IG Reels', color: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200' },
    youtube_shorts: { name: 'YT Shorts', color: 'border-red-500/30 bg-red-500/10 text-red-200' },
    fb_reels: { name: 'FB Reels', color: 'border-blue-500/30 bg-blue-500/10 text-blue-200' },
  };
  const item = labels[platform] || { name: platform, color: 'border-zinc-700 bg-zinc-800 text-zinc-200' };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${item.color}`}>
      {item.name}
    </span>
  );
}

export function PayoutStatusChip({ status }: { status: PayoutRequestStatus }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
        Paid
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-300">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
      Pending Settlement
    </span>
  );
}

export function DisputeStatusChip({ status }: { status: DisputeStatus }) {
  if (status === 'open') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-300">
        Open Dispute
      </span>
    );
  }
  if (status === 'resolved_overturned') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
        Resolved · Views Adjusted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-600 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
      Resolved · Snapshot Upheld
    </span>
  );
}
