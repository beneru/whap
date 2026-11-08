'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import {
  calculateCampaignBudgetSummary,
  formatMoneyCents,
  getPostDeadlineStatus,
  getViewUpdateReminderStatus,
} from '@/lib/payout-math';
import { PlatformBadge, SubmissionStatusChip } from '@/components/StatusChip';
import { PlatformId } from '@/lib/types';

export default function HolderPostedAndViewsPage() {
  const {
    db,
    currentUser,
    openAuthModal,
    submitPostUrl,
    addViewSnapshot,
    flagOverduePostDeadline,
  } = useWhap();

  // State for submitting Post URL on a selected clip
  const [postUrlTargetId, setPostUrlTargetId] = useState<string | null>(null);
  const [postUrlInput, setPostUrlInput] = useState(
    'https://www.tiktok.com/@apexclipspage/video/743998123456'
  );
  const [postPlatformInput, setPostPlatformInput] = useState<PlatformId>('tiktok');
  const [initialViewsInput, setInitialViewsInput] = useState(1200);
  const [initialProofInput, setInitialProofInput] = useState(
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80'
  );

  // State for logging a new 7-day View Snapshot
  const [snapshotTargetId, setSnapshotTargetId] = useState<string | null>(null);
  const [newViewsInput, setNewViewsInput] = useState(32000);
  const [newProofUrlInput, setNewProofUrlInput] = useState(
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
  );
  const [newSnapshotNote, setNewSnapshotNote] = useState('Weekly creator studio screenshot check');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <button
          type="button"
          onClick={() => openAuthModal('/holder/posted')}
          className="rounded-xl bg-tally px-4 py-2 text-xs font-bold text-zinc-950"
        >
          Sign In
        </button>
      </div>
    );
  }

  const selectedAwaitingPost = db.submissions.filter((s) => s.status === 'selected');
  const postedClips = db.submissions.filter((s) => ['posted', 'paid'].includes(s.status));

  const handlePostUrlSubmit = async (e: React.FormEvent, submissionId: string) => {
    e.preventDefault();
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const updated = await submitPostUrl({
        submission_id: submissionId,
        posted_url: postUrlInput,
        posted_platform: postPlatformInput,
        initial_views: initialViewsInput,
        proof_url: initialProofInput,
      });
      setPostUrlTargetId(null);
      setToastMsg(
        `Submitted live post URL for ${updated.file_name}! 30-day view tracking is now active.`
      );
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleAddSnapshotSubmit = async (e: React.FormEvent, submissionId: string) => {
    e.preventDefault();
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const snap = await addViewSnapshot({
        submission_id: submissionId,
        views: newViewsInput,
        source: 'manual',
        proof_url: newProofUrlInput,
        note: newSnapshotNote,
      });
      setSnapshotTargetId(null);
      setToastMsg(
        `Saved view snapshot (${snap.views.toLocaleString()} views) and updated editor earnings & ledger!`
      );
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-white/10 pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
          72h Post URL SLA · 7-Day View Snapshot Updates
        </span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
          Posted Clips &amp; View Tracking
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Submit the live post URL within 72h of selecting a clip, then log view snapshots with screenshot proof at least every 7 days.
        </p>
      </div>

      {toastMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* SECTION A: SELECTED CLIPS AWAITING POST URL (72h SLA) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            1. Selected Clips Awaiting Post URL ({selectedAwaitingPost.length})
          </h2>
        </div>

        {selectedAwaitingPost.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface p-6 text-xs text-zinc-400">
            All selected clips have live post URLs submitted.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {selectedAwaitingPost.map((sub) => {
              const camp = db.campaigns.find((c) => c.id === sub.campaign_id);
              const editor = db.profiles.find((p) => p.id === sub.editor_id);
              const sla = getPostDeadlineStatus(sub);

              return (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <SubmissionStatusChip status={sub.status} />
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                        sla.state === 'overdue'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {sla.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{sub.file_name}</h3>
                    <p className="text-xs text-zinc-400">
                      Editor: <span className="text-zinc-200">@{editor?.username}</span> · Campaign:{' '}
                      <span className="text-zinc-200">{camp?.title}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPostUrlTargetId(postUrlTargetId === sub.id ? null : sub.id)
                      }
                      className="rounded-xl bg-tally px-3.5 py-2 text-xs font-extrabold text-zinc-950 hover:bg-tally-bright"
                    >
                      Submit Live Post URL + Proof
                    </button>

                    {!sub.missed_post_deadline && (
                      <button
                        type="button"
                        onClick={() => {
                          flagOverduePostDeadline(sub.id);
                          setToastMsg(
                            `Flagged missed 72h deadline on ${sub.file_name}: Editor and Admin notified, Account Holder profile flagged.`
                          );
                        }}
                        className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                      >
                        Simulate 72h Deadline Miss
                      </button>
                    )}
                  </div>

                  {postUrlTargetId === sub.id && (
                    <form
                      onSubmit={(e) => handlePostUrlSubmit(e, sub.id)}
                      className="rounded-xl border border-tally/40 bg-elevated p-4 space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300">
                          Live Post URL (TikTok, Reels, or Shorts)
                        </label>
                        <input
                          type="url"
                          required
                          value={postUrlInput}
                          onChange={(e) => setPostUrlInput(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300">
                            Platform
                          </label>
                          <select
                            value={postPlatformInput}
                            onChange={(e) =>
                              setPostPlatformInput(e.target.value as PlatformId)
                            }
                            className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                          >
                            <option value="tiktok">TikTok</option>
                            <option value="ig_reels">IG Reels</option>
                            <option value="youtube_shorts">YouTube Shorts</option>
                            <option value="fb_reels">FB Reels</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300">
                            Current Views
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={initialViewsInput}
                            onChange={(e) => setInitialViewsInput(Number(e.target.value))}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300">
                          Screenshot Proof URL
                        </label>
                        <input
                          type="url"
                          required
                          value={initialProofInput}
                          onChange={(e) => setInitialProofInput(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-lg bg-tally py-2 text-xs font-extrabold text-zinc-950"
                      >
                        Confirm Live Post &amp; Start 30-Day View Tracking
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION B: POSTED CLIPS + 7-DAY VIEW SNAPSHOT TRACKER */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-tally-bright" />
          2. Posted Clips &amp; Weekly View Snapshots ({postedClips.length})
        </h2>

        <div className="space-y-4">
          {postedClips.map((sub) => {
            const camp = db.campaigns.find((c) => c.id === sub.campaign_id);
            const editor = db.profiles.find((p) => p.id === sub.editor_id);
            const snapshots = db.view_snapshots.filter((sn) => sn.submission_id === sub.id);
            const reminder = getViewUpdateReminderStatus(
              sub,
              db.settings.view_update_interval_days
            );
            const budget = camp
              ? calculateCampaignBudgetSummary(camp, db.submissions)
              : null;

            return (
              <div
                key={sub.id}
                className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SubmissionStatusChip status={sub.status} />
                    {sub.posted_platform && (
                      <PlatformBadge platform={sub.posted_platform} />
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                        reminder.isDue
                          ? 'bg-red-500/20 text-red-300 border border-red-500/35'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {reminder.label}
                    </span>
                  </div>

                  {sub.posted_url && (
                    <a
                      href={sub.posted_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-tally-bright hover:underline"
                    >
                      {sub.posted_url} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
                  <div className="sm:col-span-5">
                    <h3 className="text-base font-bold text-white">{sub.file_name}</h3>
                    <p className="text-xs text-zinc-400">
                      Editor: <span className="text-zinc-200">@{editor?.username}</span> ·{' '}
                      {camp?.title}
                    </p>
                  </div>

                  <div className="sm:col-span-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-elevated p-3 text-center">
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">
                        Counted Views
                      </span>
                      <span className="font-mono text-sm font-extrabold text-white">
                        {sub.counted_views.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-zinc-400">
                        Accrued Payout
                      </span>
                      <span className="font-mono text-sm font-extrabold text-emerald-300">
                        {formatMoneyCents(sub.net_earnings_cents, camp?.currency || 'USD')}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSnapshotTargetId(snapshotTargetId === sub.id ? null : sub.id);
                        setNewViewsInput(sub.counted_views + 8500);
                      }}
                      className="w-full sm:w-auto rounded-xl bg-tally px-4 py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-tally-bright"
                    >
                      + Log View Snapshot
                    </button>
                  </div>
                </div>

                {/* Inline New View Snapshot Form */}
                {snapshotTargetId === sub.id && (
                  <form
                    onSubmit={(e) => handleAddSnapshotSubmit(e, sub.id)}
                    className="rounded-xl border border-tally/40 bg-elevated p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-tally-bright">
                        Record Verified View Snapshot (Remaining Campaign Budget:{' '}
                        {formatMoneyCents(
                          budget?.remainingBudgetCents || 0,
                          camp?.currency || 'USD'
                        )}
                        )
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300">
                          Current Verified Views
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={newViewsInput}
                          onChange={(e) => setNewViewsInput(Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300">
                          Screenshot Proof URL
                        </label>
                        <input
                          type="url"
                          required
                          value={newProofUrlInput}
                          onChange={(e) => setNewProofUrlInput(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300">
                          Snapshot Note
                        </label>
                        <input
                          type="text"
                          value={newSnapshotNote}
                          onChange={(e) => setNewSnapshotNote(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="rounded-lg bg-tally px-4 py-2 text-xs font-extrabold text-zinc-950"
                    >
                      Save Snapshot &amp; Recalculate Earnings
                    </button>
                  </form>
                )}

                {/* Existing Snapshots List */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {snapshots.map((sn) => (
                    <div
                      key={sn.id}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-inset px-3 py-1.5 text-xs"
                    >
                      <span className="font-mono font-bold text-white">
                        {sn.views.toLocaleString()} views
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        ({new Date(sn.created_at).toLocaleDateString()})
                      </span>
                      <a
                        href={sn.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-tally-bright hover:underline"
                      >
                        Proof
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
