'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { PayoutStatusChip } from '@/components/StatusChip';
import { CurrencyCode, PayoutMethodType } from '@/lib/types';

export default function EditorPayoutsPage() {
  const {
    db,
    currentUser,
    openAuthModal,
    savePayoutMethod,
    requestPayout,
    getUserAvailableBalanceCents,
    getUserTotalEarnedCents,
  } = useWhap();

  const [methodType, setMethodType] = useState<PayoutMethodType>(
    currentUser?.payout_method_type || 'gcash'
  );
  const [gcashNumber, setGcashNumber] = useState(
    currentUser?.payout_method_details?.gcash_number || '09175501928'
  );
  const [gcashName, setGcashName] = useState(
    currentUser?.payout_method_details?.gcash_name || currentUser?.display_name || ''
  );
  const [paypalEmail, setPaypalEmail] = useState(
    currentUser?.payout_method_details?.paypal_email || currentUser?.email || ''
  );
  const [bankName, setBankName] = useState(
    currentUser?.payout_method_details?.bank_name || 'BPI / UnionBank'
  );
  const [bankAccNumber, setBankAccNumber] = useState(
    currentUser?.payout_method_details?.bank_account_number || '00192837465'
  );
  const [bankAccName, setBankAccName] = useState(
    currentUser?.payout_method_details?.bank_account_name || currentUser?.display_name || ''
  );

  const [payoutCurrency, setPayoutCurrency] = useState<CurrencyCode>('USD');
  const [customAmountDollars, setCustomAmountDollars] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-white">Payouts &amp; Financial Ledger</h1>
        <button
          type="button"
          onClick={() => openAuthModal('/editor/payouts')}
          className="rounded-xl bg-tally px-4 py-2 text-xs font-bold text-zinc-950"
        >
          Sign In
        </button>
      </div>
    );
  }

  const availableUsdCents = getUserAvailableBalanceCents(currentUser.id, 'USD');
  const availablePhpCents = getUserAvailableBalanceCents(currentUser.id, 'PHP');
  const totalEarnedUsd = getUserTotalEarnedCents(currentUser.id, 'USD');
  const totalEarnedPhp = getUserTotalEarnedCents(currentUser.id, 'PHP');
  const hasAnyEarning = totalEarnedUsd > 0 || totalEarnedPhp > 0;

  const minPayoutUsdCents = db.settings.min_payout_cents; // Default 1000 ($10.00)
  const minPayoutPhpCents = Math.max(50000, db.settings.min_payout_cents); // ₱500.00

  const currentAvailableCents =
    payoutCurrency === 'USD' ? availableUsdCents : availablePhpCents;
  const currentMinCents =
    payoutCurrency === 'USD' ? minPayoutUsdCents : minPayoutPhpCents;
  const canRequestPayout =
    Boolean(currentUser.payout_method_type) && currentAvailableCents >= currentMinCents;

  const myPayoutRequests = db.payout_requests.filter((p) => p.editor_id === currentUser.id);
  const myLedger = db.ledger_entries.filter((l) => l.user_id === currentUser.id);

  const handleSavePayoutMethod = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      savePayoutMethod({
        type: methodType,
        gcash_number: methodType === 'gcash' ? gcashNumber : undefined,
        gcash_name: methodType === 'gcash' ? gcashName || currentUser.display_name : undefined,
        paypal_email: methodType === 'paypal' ? paypalEmail : undefined,
        bank_name: methodType === 'bank' ? bankName : undefined,
        bank_account_number: methodType === 'bank' ? bankAccNumber : undefined,
        bank_account_name: methodType === 'bank' ? bankAccName || currentUser.display_name : undefined,
      });
      setStatusMsg(`Saved ${methodType.toUpperCase()} payout method for @${currentUser.username}.`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const requestedCents = customAmountDollars
        ? Math.round(Number(customAmountDollars) * 100)
        : currentAvailableCents;

      const req = requestPayout({
        amount_cents: requestedCents,
        currency: payoutCurrency,
      });
      setCustomAmountDollars('');
      setStatusMsg(
        `Requested payout of ${formatMoneyCents(req.amount_cents, req.currency)} via ${req.payout_method_summary}!`
      );
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
          Editor Withdrawals &amp; Double-Entry Ledger
        </span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
          Payouts &amp; Financial Ledger
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Payout methods are collected only when your first earning appears. Minimum withdrawal threshold is{' '}
          {formatMoneyCents(minPayoutUsdCents, 'USD')} (configurable in Admin Settings).
        </p>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 6 Cols: Balance & Request Payout */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-tally-bright" />
                <h2 className="text-base font-bold text-white">Available Balance</h2>
              </div>
              <div className="flex rounded-lg border border-white/10 bg-inset p-0.5 text-xs">
                {(['USD', 'PHP'] as const).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setPayoutCurrency(cur)}
                    className={`rounded-md px-2.5 py-1 font-mono font-bold ${
                      payoutCurrency === cur
                        ? 'bg-tally text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-elevated p-4 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] uppercase text-zinc-400">
                  Withdrawable ({payoutCurrency})
                </span>
                <p className="mt-0.5 font-mono text-3xl font-extrabold text-emerald-300">
                  {formatMoneyCents(currentAvailableCents, payoutCurrency)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase text-zinc-400">Min Threshold</span>
                <p className="mt-0.5 font-mono text-sm font-bold text-zinc-200">
                  {formatMoneyCents(currentMinCents, payoutCurrency)}
                </p>
              </div>
            </div>

            {/* Progress toward minimum payout */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Minimum Payout Progress</span>
                <span className="font-mono font-bold text-white">
                  {Math.min(100, Math.round((currentAvailableCents / currentMinCents) * 100))}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-tally transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((currentAvailableCents / currentMinCents) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  Withdrawal Amount ({payoutCurrency}) · Leave blank for full balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={currentMinCents / 100}
                  max={currentAvailableCents / 100}
                  value={customAmountDollars}
                  onChange={(e) => setCustomAmountDollars(e.target.value)}
                  placeholder={`${(currentAvailableCents / 100).toFixed(2)}`}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2 font-mono text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={!canRequestPayout}
                className="w-full rounded-xl bg-tally py-3 text-sm font-extrabold text-zinc-950 transition hover:bg-tally-bright disabled:opacity-40"
              >
                {!currentUser.payout_method_type
                  ? 'Add Payout Method on Right First'
                  : currentAvailableCents < currentMinCents
                  ? `Reach ${formatMoneyCents(currentMinCents, payoutCurrency)} to Request Payout`
                  : `Request Payout (${formatMoneyCents(
                      customAmountDollars
                        ? Math.round(Number(customAmountDollars) * 100)
                        : currentAvailableCents,
                      payoutCurrency
                    )})`}
              </button>
            </form>
          </div>
        </div>

        {/* Right 6 Cols: Payout Method Configurator (GCash, PayPal, Bank) */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-tally-bright" />
                <h2 className="text-base font-bold text-white">Payout Method</h2>
              </div>
              {currentUser.payout_method_type ? (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  Active: {currentUser.payout_method_type.toUpperCase()}
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  {hasAnyEarning ? 'First Earning Ready · Set Up Now' : 'Not Required Until First Earning'}
                </span>
              )}
            </div>

            {!hasAnyEarning && !currentUser.payout_method_type && (
              <div className="rounded-xl border border-white/10 bg-elevated p-3 text-xs text-zinc-300">
                <Sparkles className="inline h-3.5 w-3.5 text-tally-bright mr-1" />
                You do not need to enter payout details until your first clip earns money, though you can pre-configure it below anytime.
              </div>
            )}

            <form onSubmit={handleSavePayoutMethod} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                {(['gcash', 'paypal', 'bank'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMethodType(t)}
                    className={`rounded-xl border py-2 text-xs font-bold uppercase transition ${
                      methodType === t
                        ? 'border-tally-bright bg-tally/15 text-white'
                        : 'border-white/10 bg-elevated text-zinc-400 hover:text-white'
                    }`}
                  >
                    {t === 'gcash' ? 'GCash' : t === 'paypal' ? 'PayPal' : 'Bank Transfer'}
                  </button>
                ))}
              </div>

              {methodType === 'gcash' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      GCash Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      value={gcashNumber}
                      onChange={(e) => setGcashNumber(e.target.value)}
                      placeholder="0917xxxxxxx"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Verified Account Name
                    </label>
                    <input
                      type="text"
                      required
                      value={gcashName}
                      onChange={(e) => setGcashName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {methodType === 'paypal' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    PayPal Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                  />
                </div>
              )}

              {methodType === 'bank' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300">Bank Name</label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={bankAccNumber}
                        onChange={(e) => setBankAccNumber(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bankAccName}
                      onChange={(e) => setBankAccName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl border border-tally/40 bg-tally/15 py-2.5 text-xs font-bold text-tally-bright hover:bg-tally/25"
              >
                Save Payout Method
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Payout Requests History */}
      <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-3">
        <h2 className="text-base font-bold text-white">
          Payout Requests ({myPayoutRequests.length})
        </h2>
        {myPayoutRequests.length === 0 ? (
          <p className="text-xs text-zinc-500">No payout requests submitted yet.</p>
        ) : (
          <div className="space-y-2.5">
            {myPayoutRequests.map((pr) => (
              <div
                key={pr.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-elevated p-3.5 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-white">
                      {formatMoneyCents(pr.amount_cents, pr.currency)}
                    </span>
                    <PayoutStatusChip status={pr.status} />
                  </div>
                  <p className="text-zinc-400">
                    Destination: <span className="text-zinc-200">{pr.payout_method_summary}</span>
                  </p>
                  {pr.reference_number && (
                    <p className="font-mono text-[11px] text-emerald-300">
                      Reference #: {pr.reference_number}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {pr.receipt_url && (
                    <a
                      href={pr.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-tally-bright hover:underline"
                    >
                      Receipt Image <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <span className="font-mono text-[11px] text-zinc-400">
                    {new Date(pr.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Immutable User Ledger */}
      <div className="rounded-2xl border border-white/10 bg-surface p-5 space-y-3">
        <h2 className="text-base font-bold text-white">
          Full Financial Ledger ({myLedger.length} Entries)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-400">
                <th className="py-2.5 pr-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 pl-3 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {myLedger.map((entry) => (
                <tr key={entry.id} className="text-zinc-200">
                  <td className="py-2.5 pr-3 text-[11px] text-zinc-400">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        entry.entry_type === 'earning'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : entry.entry_type === 'payout'
                          ? 'bg-sky-500/15 text-sky-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {entry.entry_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-zinc-300">{entry.description}</td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold ${
                      entry.amount_cents >= 0 ? 'text-emerald-300' : 'text-zinc-200'
                    }`}
                  >
                    {entry.amount_cents >= 0 ? '+' : ''}
                    {formatMoneyCents(entry.amount_cents, entry.currency)}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-white">
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
