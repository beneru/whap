'use client';

import React, { useState } from 'react';
import {
  ArrowSquareOut,
  CheckCircle,
  Coins,
  Flag,
  GearSix,
  ShieldCheck,
  Users,
  WarningCircle,
} from '@phosphor-icons/react';
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

  const [activeTab, setActiveTab] = useState<
    'disputes' | 'payouts' | 'users' | 'settings'
  >('disputes');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dispute resolution state
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>(
    {}
  );
  const [correctedViewsMap, setCorrectedViewsMap] = useState<
    Record<string, number>
  >({});

  // Payout mark-paid state
  const [refInputMap, setRefInputMap] = useState<Record<string, string>>({});
  const [receiptInputMap, setReceiptInputMap] = useState<Record<string, string>>(
    {}
  );

  // Manual Ledger Adjustment state
  const [adjUserId, setAdjUserId] = useState('editor-1');
  const [adjAmountDollars, setAdjAmountDollars] = useState('10.00');
  const [adjCurrency, setAdjCurrency] = useState<CurrencyCode>('USD');
  const [adjDesc, setAdjDesc] = useState(
    'Bonus adjustment for verified view snapshot'
  );

  // Admin Settings state
  const [feePercent, setFeePercent] = useState(
    db.settings.platform_fee_percent
  );
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
          ? 'Checked live post screenshot; updated view count and credited editor ledger.'
          : 'Original snapshot timestamp confirmed accurate.');
      const correctedViews =
        correctedViewsMap[disputeId] ?? defaultClaimedViews;

      resolveDispute({
        dispute_id: disputeId,
        decision,
        corrected_views: correctedViews,
        resolution_note: note,
      });
      setToastMsg(`Dispute ${disputeId} resolved. Both sides notified.`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleMarkPaid = (payoutId: string) => {
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const refNum = refInputMap[payoutId] || 'ADMIN-REF-2026-88120';
      const receiptUrl =
        receiptInputMap[payoutId] ||
        'https://storage.whap.app/receipts/admin-payout-proof.png';
      markPayoutPaid({
        payout_id: payoutId,
        reference_number: refNum,
        receipt_image_url: receiptUrl,
      });
      setToastMsg(`Payout ${payoutId} marked paid (Ref: ${refNum}).`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const cents = Math.round(Number(adjAmountDollars) * 100);
      addAdminLedgerAdjustment({
        user_id: adjUserId,
        amount_cents: cents,
        currency: adjCurrency,
        description: adjDesc,
      });
      setToastMsg('Ledger adjustment added.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setToastMsg(null);
    try {
      updatePlatformSettings({
        platform_fee_percent: Number(feePercent),
        min_payout_cents: Math.round(Number(minPayoutDollars) * 100),
        post_deadline_hours: Number(postDeadlineHours),
        view_update_interval_days: Number(viewUpdateIntervalDays),
        default_tracking_window_days: Number(trackingWindowDays),
      });
      setToastMsg('Platform settings saved.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="card-sticker bg-mint p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="chip-sticker bg-sprout text-ink">
            <ShieldCheck weight="bold" className="h-4 w-4" />
            <span>Trust, Payouts &amp; Disputes</span>
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">
            Marketplace Admin Console
          </h1>
          <p className="text-sm text-muted">
            Resolve view snapshot disputes, mark payouts paid, suspend accounts,
            and manage platform settings.
          </p>
        </div>

        {/* Admin Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'disputes', label: 'Disputes', Icon: Flag },
            { id: 'payouts', label: 'Payouts & Ledger', Icon: Coins },
            { id: 'users', label: 'Users', Icon: Users },
            { id: 'settings', label: 'Settings', Icon: GearSix },
          ].map((tab) => {
            const Icon = tab.Icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.id as 'disputes' | 'payouts' | 'users' | 'settings'
                  )
                }
                className={`btn-sticker py-2 px-4 text-xs ${
                  isCurrent ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <Icon weight="bold" className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {toastMsg && (
        <div className="flex items-center gap-2.5 rounded-btn border-2 border-ink bg-sprout p-4 text-sm font-extrabold text-ink shadow-btn">
          <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-btn border-2 border-ink bg-coral p-4 text-sm font-extrabold text-ink shadow-btn">
          <WarningCircle weight="bold" className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: DISPUTES */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <h2 className="font-display text-2xl text-ink">
            Dispute Queue ({db.disputes.length})
          </h2>
          {db.disputes.map((disp) => {
            const sub = db.submissions.find((s) => s.id === disp.submission_id);
            const snap = db.view_snapshots.find(
              (v) => v.id === disp.snapshot_id
            );
            const editor = db.profiles.find((p) => p.id === disp.opened_by);

            return (
              <div key={disp.id} className="card-sticker p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-forest">
                      Clip: {sub?.file_name} · Opened by @{editor?.username}
                    </span>
                    <h3 className="text-lg font-extrabold text-ink">
                      {disp.reason}
                    </h3>
                  </div>
                  <DisputeStatusChip status={disp.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs tabular-nums">
                  <div className="rounded-btn border-2 border-ink bg-mint p-3">
                    <span className="font-bold text-muted">
                      Snapshot Views Logged
                    </span>
                    <p className="font-display text-xl text-ink">
                      {(snap?.views || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-btn border-2 border-ink bg-sun p-3">
                    <span className="font-extrabold text-ink">
                      Editor Claimed Views
                    </span>
                    <p className="font-display text-xl text-ink">
                      {disp.claimed_views.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-btn border-2 border-ink bg-mint p-3 flex items-center justify-between">
                    <span className="font-bold text-ink">Screenshot Proof</span>
                    {disp.evidence_url && (
                      <a
                        href={disp.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-extrabold text-forest underline"
                      >
                        <span>Open</span>
                        <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {disp.status === 'open' ? (
                  <div className="rounded-card border-2 border-ink bg-mint p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor={`corr-views-${disp.id}`}
                          className="mb-1 block text-xs font-extrabold text-ink"
                        >
                          Verified view count
                        </label>
                        <input
                          id={`corr-views-${disp.id}`}
                          type="number"
                          value={
                            correctedViewsMap[disp.id] ?? disp.claimed_views
                          }
                          onChange={(e) =>
                            setCorrectedViewsMap((prev) => ({
                              ...prev,
                              [disp.id]: Number(e.target.value),
                            }))
                          }
                          className="input-sticker tabular-nums"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`res-note-${disp.id}`}
                          className="mb-1 block text-xs font-extrabold text-ink"
                        >
                          Admin decision note
                        </label>
                        <input
                          id={`res-note-${disp.id}`}
                          type="text"
                          value={
                            resolutionNotes[disp.id] ??
                            'Verified live post screenshot; updated view count and credited editor ledger.'
                          }
                          onChange={(e) =>
                            setResolutionNotes((prev) => ({
                              ...prev,
                              [disp.id]: e.target.value,
                            }))
                          }
                          className="input-sticker"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleResolveDispute(
                            disp.id,
                            'resolved_overturned',
                            disp.claimed_views
                          )
                        }
                        className="btn-sticker btn-primary text-xs"
                      >
                        <CheckCircle weight="bold" className="h-4 w-4" />
                        <span>Update Views &amp; Credit Editor</span>
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
                        className="btn-sticker btn-secondary text-xs"
                      >
                        <span>Keep Original Snapshot</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-forest">
                    Resolution: {disp.resolution_note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PAYOUTS & LEDGER */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="card-sticker p-6 space-y-4">
            <h2 className="font-display text-2xl text-ink">
              Payout Requests ({db.payout_requests.length})
            </h2>
            <div className="space-y-3">
              {db.payout_requests.map((pr) => {
                const editor = db.profiles.find((p) => p.id === pr.editor_id);
                return (
                  <div
                    key={pr.id}
                    className="rounded-card border-2 border-ink bg-mint p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-forest">
                          @{editor?.username} ({editor?.display_name})
                        </span>
                        <p className="font-display text-2xl text-ink tabular-nums">
                          {formatMoneyCents(pr.amount_cents, pr.currency)}
                        </p>
                      </div>
                      <PayoutStatusChip status={pr.status} />
                    </div>

                    {(pr.status === 'pending' || pr.status === 'requested') && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label
                            htmlFor={`adm-ref-${pr.id}`}
                            className="mb-1 block text-xs font-extrabold text-ink"
                          >
                            Payment reference number
                          </label>
                          <input
                            id={`adm-ref-${pr.id}`}
                            type="text"
                            value={
                              refInputMap[pr.id] ?? 'ADMIN-REF-2026-88120'
                            }
                            onChange={(e) =>
                              setRefInputMap((prev) => ({
                                ...prev,
                                [pr.id]: e.target.value,
                              }))
                            }
                            className="input-sticker tabular-nums"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`adm-rec-${pr.id}`}
                            className="mb-1 block text-xs font-extrabold text-ink"
                          >
                            Receipt image URL
                          </label>
                          <input
                            id={`adm-rec-${pr.id}`}
                            type="url"
                            value={
                              receiptInputMap[pr.id] ??
                              'https://storage.whap.app/receipts/admin-payout-proof.png'
                            }
                            onChange={(e) =>
                              setReceiptInputMap((prev) => ({
                                ...prev,
                                [pr.id]: e.target.value,
                              }))
                            }
                            className="input-sticker"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(pr.id)}
                            className="btn-sticker btn-primary w-full text-xs"
                          >
                            <Coins weight="bold" className="h-4 w-4" />
                            <span>Mark Paid</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Ledger Adjustment */}
          <form
            onSubmit={handleAddAdjustment}
            className="card-sticker p-6 space-y-4"
          >
            <h2 className="font-display text-2xl text-ink">
              Add Ledger Adjustment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="adj-user"
                  className="mb-1 block text-xs font-extrabold text-ink"
                >
                  Editor
                </label>
                <select
                  id="adj-user"
                  value={adjUserId}
                  onChange={(e) => setAdjUserId(e.target.value)}
                  className="input-sticker"
                >
                  {db.profiles
                    .filter((p) => p.role === 'editor' || p.role === 'both')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        @{p.username} ({p.display_name})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="adj-amount"
                  className="mb-1 block text-xs font-extrabold text-ink"
                >
                  Amount ($)
                </label>
                <input
                  id="adj-amount"
                  type="number"
                  step="0.01"
                  value={adjAmountDollars}
                  onChange={(e) => setAdjAmountDollars(e.target.value)}
                  className="input-sticker tabular-nums"
                />
              </div>
              <div>
                <label
                  htmlFor="adj-curr"
                  className="mb-1 block text-xs font-extrabold text-ink"
                >
                  Currency
                </label>
                <select
                  id="adj-curr"
                  value={adjCurrency}
                  onChange={(e) =>
                    setAdjCurrency(e.target.value as CurrencyCode)
                  }
                  className="input-sticker"
                >
                  <option value="USD">USD</option>
                  <option value="PHP">PHP</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="adj-desc"
                  className="mb-1 block text-xs font-extrabold text-ink"
                >
                  Reason
                </label>
                <input
                  id="adj-desc"
                  type="text"
                  value={adjDesc}
                  onChange={(e) => setAdjDesc(e.target.value)}
                  className="input-sticker"
                />
              </div>
            </div>
            <button type="submit" className="btn-sticker btn-primary text-xs">
              <span>Post Ledger Adjustment</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: USERS */}
      {activeTab === 'users' && (
        <div className="card-sticker p-6 space-y-4">
          <h2 className="font-display text-2xl text-ink">
            All Accounts ({db.profiles.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink text-xs font-extrabold uppercase text-muted">
                  <th className="py-2.5 pr-4">User</th>
                  <th className="py-2.5 pr-4">Role</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink/20">
                {db.profiles.map((u) => (
                  <tr key={u.id} className="hover:bg-mint">
                    <td className="py-3 pr-4">
                      <div className="font-extrabold text-ink">
                        {u.display_name}
                      </div>
                      <div className="text-xs font-bold text-muted">
                        @{u.username} · {u.email}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full border-2 border-ink bg-mint px-2.5 py-0.5 text-xs font-extrabold uppercase text-ink">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {u.suspended ? (
                        <span className="chip-sticker bg-coral text-ink">
                          Suspended
                        </span>
                      ) : (
                        <span className="chip-sticker bg-sprout text-ink">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => toggleSuspendUser(u.id)}
                          className={`btn-sticker py-1.5 px-3 text-xs min-h-[38px] ${
                            u.suspended ? 'btn-primary' : 'btn-danger'
                          }`}
                        >
                          {u.suspended ? 'Restore Account' : 'Suspend User'}
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

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="card-sticker p-6 space-y-5 max-w-2xl"
        >
          <h2 className="font-display text-2xl text-ink">
            Platform Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="set-fee"
                className="mb-1.5 block text-sm font-extrabold text-ink"
              >
                Platform Fee (%) (default 0)
              </label>
              <input
                id="set-fee"
                type="number"
                min="0"
                max="30"
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                className="input-sticker tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="set-min-payout"
                className="mb-1.5 block text-sm font-extrabold text-ink"
              >
                Minimum Payout ($) (default $10.00)
              </label>
              <input
                id="set-min-payout"
                type="number"
                step="1"
                min="1"
                value={minPayoutDollars}
                onChange={(e) => setMinPayoutDollars(e.target.value)}
                className="input-sticker tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="set-post-hours"
                className="mb-1.5 block text-sm font-extrabold text-ink"
              >
                Post URL Deadline (hours)
              </label>
              <input
                id="set-post-hours"
                type="number"
                value={postDeadlineHours}
                onChange={(e) => setPostDeadlineHours(Number(e.target.value))}
                className="input-sticker tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="set-view-days"
                className="mb-1.5 block text-sm font-extrabold text-ink"
              >
                View Snapshot Reminder (days)
              </label>
              <input
                id="set-view-days"
                type="number"
                value={viewUpdateIntervalDays}
                onChange={(e) =>
                  setViewUpdateIntervalDays(Number(e.target.value))
                }
                className="input-sticker tabular-nums"
              />
            </div>
          </div>

          <button type="submit" className="btn-sticker btn-primary">
            <CheckCircle weight="bold" className="h-5 w-5" />
            <span>Save Platform Settings</span>
          </button>
        </form>
      )}
    </div>
  );
}
