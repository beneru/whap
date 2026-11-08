import { PlatformId, ViewSnapshot } from './types';

export interface ViewTrackRequest {
  submissionId: string;
  campaignId: string;
  postUrl: string;
  platform: PlatformId;
  reportedViews?: number;
  proofUrl?: string;
  note?: string;
  actorUserId: string;
}

export interface ViewTrackResult {
  views: number;
  source: 'manual' | 'api';
  proofUrl: string;
  verified: boolean;
  fetchedAt: string;
}

/**
 * Pluggable ViewTracker interface so TikTok, YouTube Shorts, IG Reels, and FB Reels
 * API fetchers can drop in alongside the MVP ManualViewTracker without changing caller code.
 */
export interface ViewTracker {
  readonly source: 'manual' | 'api';
  supportsPlatform(platform: PlatformId): boolean;
  recordSnapshot(req: ViewTrackRequest): Promise<ViewTrackResult>;
}

/**
 * MVP ManualViewTracker: Account Holder submits live post URL, current view count, and screenshot proof.
 */
export class ManualViewTracker implements ViewTracker {
  public readonly source = 'manual' as const;

  supportsPlatform(_platform: PlatformId): boolean {
    return true;
  }

  async recordSnapshot(req: ViewTrackRequest): Promise<ViewTrackResult> {
    if (typeof req.reportedViews !== 'number' || req.reportedViews < 0) {
      throw new Error('ManualViewTracker requires a non-negative view count.');
    }
    if (!req.proofUrl || req.proofUrl.trim().length === 0) {
      throw new Error('ManualViewTracker requires a screenshot proof URL.');
    }
    return {
      views: Math.floor(req.reportedViews),
      source: 'manual',
      proofUrl: req.proofUrl.trim(),
      verified: true,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Future-ready API Tracker stub for TikTok / IG Reels / YouTube Shorts / FB Reels.
 * Designed so automated cron jobs can swap in `PlatformApiViewTracker` per platform.
 */
export class PlatformApiViewTracker implements ViewTracker {
  public readonly source = 'api' as const;
  constructor(private readonly platform: PlatformId, private readonly apiKey?: string) {}

  supportsPlatform(platform: PlatformId): boolean {
    return this.platform === platform;
  }

  async recordSnapshot(req: ViewTrackRequest): Promise<ViewTrackResult> {
    if (!this.apiKey) {
      throw new Error(
        `Automated API fetching for ${this.platform} is not enabled in MVP. Use ManualViewTracker with screenshot proof.`
      );
    }
    return {
      views: req.reportedViews ?? 0,
      source: 'api',
      proofUrl: `https://api-verifier.whap.app/${this.platform}/snapshot?url=${encodeURIComponent(req.postUrl)}`,
      verified: true,
      fetchedAt: new Date().toISOString(),
    };
  }
}

export function getViewTracker(mode: 'manual' | 'api' = 'manual', platform: PlatformId = 'tiktok'): ViewTracker {
  if (mode === 'api') {
    return new PlatformApiViewTracker(platform, process.env.PLATFORM_TRACKER_API_KEY);
  }
  return new ManualViewTracker();
}

export function createSnapshotFromResult(
  id: string,
  req: ViewTrackRequest,
  res: ViewTrackResult
): ViewSnapshot {
  return {
    id,
    submission_id: req.submissionId,
    campaign_id: req.campaignId,
    views: res.views,
    source: res.source,
    proof_url: res.proofUrl,
    note: req.note || null,
    verified: res.verified,
    created_by: req.actorUserId,
    created_at: res.fetchedAt,
  };
}
