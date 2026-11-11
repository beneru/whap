'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Coins,
  WarningCircle,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { PayoutStatusChip } from '@/components/StatusChip';
import { PayoutMethodType } from '@/lib/types';

/**
 * Money Screen Rule:
 * Same sticker-sheet style (2px ink borders, hard shadows, flat colors),
 * but calm: no wiggle, no confetti, big clear numbers (Bricolage Grotesque >= 20px,
 * Gabarito tabular-nums for ledger rows). Trust beats fun here.
 */
export default function EditorPayoutsPage() {
  const {
    db,
    currentUser,
    getEditorWalletSummary,
    savePayoutMethod,
    requestPayout,
  } = useWhap();

  const editorId = currentUser?.id || 'editor-1';
  const editor =
    db.profiles.find((p) => p.id === editorId) || db.profiles[2];
  const wallet = getEditorWalletSummary(editor.id);

  const [methodType, setMethodType] = useState<PayoutMethodType>(
    editor.payout_method_type || 'gcash'
  );
  const [gcashNumber, setGcashNumber] = useState(
    editor.payout_method_details?.gcash_number || '09175550199'
  );
  const [gcashName, setGcashName] = useState(
    editor.payout_method_details?.gcash_name || editor.display_name
  );
  const [paypalEmail, setPaypalEmail] = useState(
    editor.payout_method_details?.paypal_email || editor.email
  );
  const [bankName, setBankName] = useState(
    editor.payout_method_details?.bank_name || 'BPI'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    editor.payout_method_details?.bank_account_number || '0042918821'
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    editor.payout_method_details?.bank_account_holder || editor.display_name
  );

  const [payoutAmountDollars, setPayoutAmountDollars] = useState(
    Math.max(10, wallet.availableBalanceCents / 100).toFixed(2)
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const myPayoutRequests = db.payout_requests.filter(
    (p) => p.editor_id === editor.id
  );
  const myLedger = db.ledger_entries.filter((l) => l.user_id === editor.id);

  const handleSaveMethod = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setToastMsg(null);
    try {
      if (methodType === 'gcash') {
        savePayoutMethod({
          type: 'gcash',
          gcash_number: gcashNumber,
          gcash_name: gcashName,
        });
      } else if (methodType === 'paypal') {
        savePayoutMethod({
          type: 'paypal',
          paypal_email: paypalEmail,
        });
      } else {
        savePayoutMethod({
          type: 'bank',
          bank_name: bankName,
          bank_account_number: bankAccountNumber,
          bank_account_holder: bankAccountHolder,
        });
      }
      setToastMsg('Payout method saved.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const cents = Math.round(Number(payoutAmountDollars) * 100);
      requestPayout({ amount_cents: cents, currency: 'USD' });
      setToastMsg('Payout request sent. Your ledger is updated.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Payouts &amp; Financial Ledger
        </h1>
        <p className="mt-1 text-sm text-muted">
          Payout details are only collected after your first clip earns money.
          Minimum payout is{' '}
          {formatMoneyCents(db.settings.min_payout_cents, 'USD')}.
        </p>
      </div>

      {toastMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-sprout/20 p-4 text-sm font-semibold text-ink shadow-sm">
          <CheckCircle weight="bold" className="h-5 w-5 shrink-0 text-forest" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-coral/40 bg-coral/15 p-4 text-sm font-semibold text-ink shadow-sm">
          <WarningCircle weight="bold" className="h-5 w-5 shrink-0 text-coral" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Calm Money Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-sticker p-6 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Available Balance
          </span>
          <p className="font-display text-3xl text-forest tabular-nums">
            {formatMoneyCents(wallet.availableBalanceCents, 'USD')}
          </p>
          <p className="text-xs font-bold text-muted">
            Min {formatMoneyCents(db.settings.min_payout_cents, 'USD')} required
          </p>
        </div>

        <div className="card-sticker p-6 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Total Earned
          </span>
          <p className="font-display text-3xl text-ink tabular-nums">
            {formatMoneyCents(wallet.totalEarnedCents, 'USD')}
          </p>
          <p className="text-xs font-bold text-muted">
            Base pay + counted view earnings
          </p>
        </div>

        <div className="card-sticker p-6 space-y-1">
          <span className="text-xs font-extrabold uppercase text-muted">
            Paid Out So Far
          </span>
          <p className="font-display text-3xl text-ink tabular-nums">
            {formatMoneyCents(wallet.totalPaidCents, 'USD')}
          </p>
          <p className="text-xs font-bold text-muted">
            In queue: {formatMoneyCents(wallet.pendingPayoutCents, 'USD')}
          </p>
        </div>
      </div>

      {/* Payout Method + Request Payout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Payout Method Setup (Collected only when first earning appears) */}
        <div className="card-sticker p-6 space-y-4">
          <h2 className="font-display text-2xl text-ink">
            Where to Send Your Money
          </h2>

          {wallet.totalEarnedCents === 0 ? (
            <div className="rounded-xl border border-border bg-mint/50 p-4 text-sm font-medium text-ink">
              You do not need to fill out payout details yet. This form opens as
              soon as your first clip earns money.
            </div>
          ) : (
            <form onSubmit={handleSaveMethod} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['gcash', 'paypal', 'bank'] as PayoutMethodType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethodType(m)}
                    className={`btn-sticker py-2 text-xs uppercase ${
                      methodType === m ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {methodType === 'gcash' && (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="payout-gcash-num"
                      className="mb-1 block text-xs font-extrabold text-ink"
                    >
                      GCash mobile number
                    </label>
                    <input
                      id="payout-gcash-num"
                      type="text"
                      required
                      value={gcashNumber}
                      onChange={(e) => setGcashNumber(e.target.value)}
                      className="input-sticker tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="payout-gcash-name"
                      className="mb-1 block text-xs font-extrabold text-ink"
                    >
                      Account full name
                    </label>
                    <input
                      id="payout-gcash-name"
                      type="text"
                      required
                      value={gcashName}
                      onChange={(e) => setGcashName(e.target.value)}
                      className="input-sticker"
                    />
                  </div>
                </div>
              )}

              {methodType === 'paypal' && (
                <div>
                  <label
                    htmlFor="payout-paypal-email"
                    className="mb-1 block text-xs font-extrabold text-ink"
                  >
                    PayPal email address
                  </label>
                  <input
                    id="payout-paypal-email"
                    type="email"
                    required
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="input-sticker"
                  />
                </div>
              )}

              {methodType === 'bank' && (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="payout-bank-name"
                      className="mb-1 block text-xs font-extrabold text-ink"
                    >
                      Bank name
                    </label>
                    <input
                      id="payout-bank-name"
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="input-sticker"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="payout-bank-num"
                      className="mb-1 block text-xs font-extrabold text-ink"
                    >
                      Account number
                    </label>
                    <input
                      id="payout-bank-num"
                      type="text"
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="input-sticker tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="payout-bank-holder"
                      className="mb-1 block text-xs font-extrabold text-ink"
                    >
                      Account holder name
                    </label>
                    <input
                      id="payout-bank-holder"
                      type="text"
                      required
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      className="input-sticker"
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-sticker btn-primary w-full">
                <span>Save Payout Method</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Request Payout */}
        <div className="card-sticker p-6 space-y-4">
          <h2 className="font-display text-2xl text-ink">Request a Payout</h2>
          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div>
              <label
                htmlFor="request-payout-amount"
                className="mb-1.5 block text-sm font-extrabold text-ink"
              >
                Amount to cash out (USD)
              </label>
              <input
                id="request-payout-amount"
                type="number"
                step="0.01"
                min="10"
                value={payoutAmountDollars}
                onChange={(e) => setPayoutAmountDollars(e.target.value)}
                className="input-sticker tabular-nums"
              />
            </div>

            <button
              type="submit"
              disabled={!wallet.canRequestPayout || !editor.payout_method_type}
              className="btn-sticker btn-primary w-full"
            >
              <Coins weight="bold" className="h-5 w-5" />
              <span>Request Payout Now</span>
            </button>

            {!wallet.canRequestPayout && (
              <p className="text-xs font-bold text-muted">
                You need at least{' '}
                {formatMoneyCents(db.settings.min_payout_cents, 'USD')} available to
                request a payout.
              </p>
            )}
          </form>

          {myPayoutRequests.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                Your Payout Requests
              </h3>
              {myPayoutRequests.map((pr) => (
                <div
                  key={pr.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-mint/50 p-3 text-xs tabular-nums"
                >
                  <div>
                    <span className="font-bold text-ink">
                      {formatMoneyCents(pr.amount_cents, pr.currency)}
                    </span>
                    <span className="ml-2 font-medium text-muted">
                      ({pr.payout_method_type.toUpperCase()} ·{' '}
                      {pr.payout_method_summary})
                    </span>
                    {pr.reference_number && (
                      <span className="block text-[11px] font-medium text-forest">
                        Ref: {pr.reference_number}
                      </span>
                    )}
                  </div>
                  <PayoutStatusChip status={pr.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Financial Ledger Table */}
      <div className="card-sticker p-6 space-y-4">
        <h2 className="font-display text-2xl font-bold text-ink">
          Full Account Ledger
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted">
                <th className="py-2.5 pr-4">Date</th>
                <th className="py-2.5 pr-4">Type</th>
                <th className="py-2.5 pr-4">Description</th>
                <th className="py-2.5 pr-4 text-right">Amount</th>
                <th className="py-2.5 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {myLedger.map((entry) => (
                <tr key={entry.id} className="hover:bg-mint/60 transition-colors">
                  <td className="py-3 pr-4 text-xs font-medium text-muted">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full border border-border bg-mint px-2.5 py-0.5 text-xs font-semibold uppercase text-ink">
                      {entry.entry_type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs font-bold text-ink">
                    {entry.description}
                  </td>
                  <td
                    className={`py-3 pr-4 text-right font-extrabold ${
                      entry.amount_cents >= 0 ? 'text-forest' : 'text-ink'
                    }`}
                  >
                    {entry.amount_cents >= 0 ? '+' : ''}
                    {formatMoneyCents(entry.amount_cents, entry.currency)}
                  </td>
                  <td className="py-3 text-right font-extrabold text-ink">
                    {formatMoneyCents(entry.balance_after_cents, entry.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
