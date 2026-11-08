'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Flag,
  Settings,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { DisputeStatusChip, PayoutStatusChip } from '@/components/StatusChip';
import { CurrencyCode } from '@/lib/types';

export default function AdminConsolePage() {
  const {
    db,
    toggleSuspendUser,
    resolveDispute,
    markPayoutPaid,
    addAdminLedgerAdjustment,
    updatePlatformSettings,
  } = useWhap();

  const [activeTab, setActiveTab] = useState<'disputes' | 'payouts' | 'users' | 'settings'>(
    'disputes'
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dispute resolution state
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [correctedViewsMap, setCorrectedViewsMap] = useState<Record<string, number>>({});

  // Payout mark-paid state
  const [refInputMap, setRefInputMap] = useState<Record<string, string>>({});
  const [receiptInputMap, setReceiptInputMap] = useState<Record<string, string>>({});

  // Manual Ledger Adjustment state
  const [adjUserId, setAdjUserId] = useState('editor-1');
  const [adjAmountDollars, setAdjAmountDollars] = useState('10.00');
  const [adjCurrency, setAdjCurrency] = useState<CurrencyCode>('USD');
  const [adjDesc, setAdjDesc] = useState('Bonus adjustment for high-retention hook');

  // Admin Settings state
  const [feePercent, setFeePercent] = useState(db.settings.platform_fee_percent);
  const [minPayoutDollars, setMinPayoutDollars] = useState(
    (db.settings.min_payout_cents / 100).toFixed(2)
  );
  const [postDeadlineHours, setPostDeadlineHours] = useState(
    db.settings.post_deadline_hours
  );
  const [viewUpdateIntervalDays, setViewUpdateIntervalDays] = useState(
    db.settings.view_update_interval_days
  );
  const [trackingWindowDays, setTrackingWindowDays] = useState(
    db.settings.default_tracking_window_days
  );

  const handleResolveDispute = (
    disputeId: string,
    decision: 'resolved_upheld' | 'resolved_overturned',
    defaultClaimedViews: number
  ) => {
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const note =
        resolutionNotes[disputeId] ||
        (decision === 'resolved_overturned'
          ? 'Verified live post screenshot proof; updated view count and credited editor ledger.'
          : 'Original snapshot timestamp verified accurate at time of capture.');
      const correctedViews = correctedViewsMap[disputeId] ?? defaultClaimedViews;

      resolveDispute({
        dispute_id: disputeId,
        decision,
        corrected_views: correctedViews,
        resolution_note: note,
      });
      setToastMsg(`Dispute ${disputeId} marked as ${decision}. Both parties notified.`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleMarkPaid = (payoutId: string) => {
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const ref = refInputMap[payoutId] || `ADMIN-SETTLE-${Date.now().toString().slice(-6)}`;
      const receipt =
        receiptInputMap[payoutId] ||
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80';
      markPayoutPaid({
        payout_request_id: payoutId,
        reference_number: ref,
        receipt_url: receipt,
      });
      setToastMsg(`Payout ${payoutId} marked PAID (Ref: ${ref}) and ledger updated!`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const cents = Math.round(Number(adjAmountDollars) * 100);
      addAdminLedgerAdjustment({
        user_id: adjUserId,
        amount_cents: cents,
        currency: adjCurrency,
        description: adjDesc,
      });
      setToastMsg(
        `Added ${formatMoneyCents(cents, adjCurrency)} ledger adjustment for user ${adjUserId}.`
      );
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      updatePlatformSettings({
        platform_fee_percent: Number(feePercent),
        min_payout_cents: Math.round(Number(minPayoutDollars) * 100),
        post_deadline_hours: Number(postDeadlineHours),
        view_update_interval_days: Number(viewUpdateIntervalDays),
        default_tracking_window_days: Number(trackingWindowDays),
      });
      setToastMsg('Platform settings updated!');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-amber-300">
            Admin Trust, Disputes, Payouts &amp; Settings
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
            Marketplace Admin Console
          </h1>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            {
              id: 'disputes' as const,
              label: `Disputes (${db.disputes.filter((d) => d.status === 'open').length})`,
              icon: Flag,
            },
            {
              id: 'payouts' as const,
              label: `Payouts (${db.payout_requests.filter((p) => p.status === 'pending').length})`,
              icon: Wallet,
            },
            {
              id: 'users' as const,
              label: `Users (${db.profiles.length})`,
              icon: Users,
            },
            {
              id: 'settings' as const,
              label: 'Settings',
              icon: Settings,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-tally text-zinc-950'
                    : 'border border-white/10 bg-surface text-zinc-300 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
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

      {/* TAB 1: DISPUTES */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {db.disputes.map((disp) => {
            const sub = db.submissions.find((s) => s.id === disp.submission_id);
            const snap = db.view_snapshots.find((sn) => sn.id === disp.snapshot_id);
            const editor = db.profiles.find((p) => p.id === disp.opened_by);
            const holder = db.profiles.find((p) => p.id === disp.against_user_id);

            return (
              <div
                key={disp.id}
                className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-zinc-400">
                      Dispute {disp.id} · Clip: {sub?.file_name}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      @{editor?.username} vs @{holder?.username}
                    </h3>
                  </div>
                  <DisputeStatusChip status={disp.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-white/10 bg-elevated p-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400">
                      Holder Reported Snapshot ({disp.snapshot_id})
                    </span>
                    <p className="mt-0.5 font-mono text-base font-bold text-white">
                      {(snap?.views || 0).toLocaleString()} views
                    </p>
                    {snap?.proof_url && (
                      <a
                        href={snap.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-tally-bright hover:underline"
                      >
                        Holder Screenshot Proof <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400">
                      Editor Claimed Views
                    </span>
                    <p className="mt-0.5 font-mono text-base font-bold text-amber-300">
                      {disp.claimed_views.toLocaleString()} views
                    </p>
                    {disp.evidence_url && (
                      <a
                        href={disp.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-tally-bright hover:underline"
                      >
                        Editor Evidence Proof <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-300">
                  <span className="font-bold text-white">Dispute Reason:</span> {disp.reason}
                </p>

                {disp.status === 'open' ? (
                  <div className="rounded-xl border border-white/10 bg-inset p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300">
                          Verified View Count (if overturning)
                        </label>
                        <input
                          type="number"
                          value={correctedViewsMap[disp.id] ?? disp.claimed_views}
                          onChange={(e) =>
                            setCorrectedViewsMap({
                              ...correctedViewsMap,
                              [disp.id]: Number(e.target.value),
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 font-mono text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Admin Resolution Note
                        </label>
                        <input
                          type="text"
                          value={resolutionNotes[disp.id] || ''}
                          onChange={(e) =>
                            setResolutionNotes({
                              ...resolutionNotes,
                              [disp.id]: e.target.value,
                            })
                          }
                          placeholder="Verified live Reel counter at 29,500 views; crediting editor ledger..."
                          className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleResolveDispute(
                            disp.id,
                            'resolved_overturned',
                            disp.claimed_views
                          )
                        }
                        className="rounded-xl bg-tally px-4 py-2 text-xs font-extrabold text-zinc-950 hover:bg-tally-bright"
                      >
                        Overturn Snapshot &amp; Credit Editor Views
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleResolveDispute(
                            disp.id,
                            'resolved_upheld',
                            snap?.views || 0
                          )
                        }
                        className="rounded-xl border border-white/15 bg-surface px-4 py-2 text-xs font-bold text-zinc-200 hover:border-white/30"
                      >
                        Uphold Original Snapshot
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-emerald-300">
                    Resolved Note: {disp.resolution_note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PAYOUTS & LEDGER ADJUSTMENT */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">All Payout Requests</h2>
            {db.payout_requests.map((pr) => {
              const editor = db.profiles.find((p) => p.id === pr.editor_id);
              return (
                <div
                  key={pr.id}
                  className="rounded-2xl border border-white/10 bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-white">
                        {formatMoneyCents(pr.amount_cents, pr.currency)}
                      </span>
                      <PayoutStatusChip status={pr.status} />
                    </div>
                    <p className="text-zinc-300">
                      Editor: <span className="font-bold text-white">@{editor?.username}</span> ·{' '}
                      {pr.payout_method_summary}
                    </p>
                    {pr.reference_number && (
                      <p className="font-mono text-emerald-300">Ref: {pr.reference_number}</p>
                    )}
                  </div>

                  {pr.status === 'pending' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={refInputMap[pr.id] || ''}
                        onChange={(e) =>
                          setRefInputMap({ ...refInputMap, [pr.id]: e.target.value })
                        }
                        placeholder="Ref # (e.g. GCASH-77192)"
                        className="rounded-lg border border-white/10 bg-inset px-3 py-1.5 font-mono text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(pr.id)}
                        className="rounded-xl bg-tally px-3.5 py-2 text-xs font-extrabold text-zinc-950"
                      >
                        Mark Paid
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Manual Ledger Adjustment Form */}
          <form
            onSubmit={handleAdjustmentSubmit}
            className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">
              Issue Manual Ledger Adjustment (Bonus / Dispute Credit / Debit)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300">User</label>
                <select
                  value={adjUserId}
                  onChange={(e) => setAdjUserId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                >
                  {db.profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      @{p.username} ({p.display_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjAmountDollars}
                  onChange={(e) => setAdjAmountDollars(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300">Currency</label>
                <select
                  value={adjCurrency}
                  onChange={(e) => setAdjCurrency(e.target.value as CurrencyCode)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                >
                  <option value="USD">USD</option>
                  <option value="PHP">PHP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300">Reason</label>
                <input
                  type="text"
                  required
                  value={adjDesc}
                  onChange={(e) => setAdjDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-tally px-4 py-2 text-xs font-extrabold text-zinc-950"
            >
              Append Ledger Adjustment
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: USERS (Suspend / Unsuspend) */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 pr-3">User</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Payout Method</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {db.profiles.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-3">
                      <span className="font-bold text-white">{u.display_name}</span>{' '}
                      <span className="font-mono text-zinc-400">@{u.username}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-300">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-tally-bright">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400">
                      {u.payout_method_type || 'none (collected on 1st earning)'}
                    </td>
                    <td className="py-3 px-3">
                      {u.suspended ? (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-300">
                          Suspended
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            toggleSuspendUser(u.id);
                            setToastMsg(
                              `${u.suspended ? 'Unsuspended' : 'Suspended'} user @${u.username}.`
                            );
                          }}
                          className={`rounded-lg px-3 py-1 text-xs font-bold ${
                            u.suspended
                              ? 'bg-emerald-500 text-zinc-950'
                              : 'border border-red-500/40 bg-red-500/15 text-red-300'
                          }`}
                        >
                          {u.suspended ? 'Unsuspend' : 'Suspend User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-white">
            Global Marketplace Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                platform_fee_percent (Default 0%)
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={50}
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 font-mono text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Minimum Payout Threshold (USD, Default $10.00)
              </label>
              <input
                type="number"
                step="1.00"
                min={1}
                value={minPayoutDollars}
                onChange={(e) => setMinPayoutDollars(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 font-mono text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Post URL SLA Window (Hours, Default 72h)
              </label>
              <input
                type="number"
                min={12}
                value={postDeadlineHours}
                onChange={(e) => setPostDeadlineHours(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 font-mono text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Required View Update Interval (Days, Default 7d)
              </label>
              <input
                type="number"
                min={1}
                value={viewUpdateIntervalDays}
                onChange={(e) => setViewUpdateIntervalDays(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 font-mono text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-tally py-3 text-xs font-extrabold text-zinc-950 hover:bg-tally-bright"
          >
            Save Platform Settings
          </button>
        </form>
      )}
    </div>
  );
}
