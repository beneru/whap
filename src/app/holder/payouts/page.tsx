'use client';

import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, Wallet } from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { PayoutStatusChip } from '@/components/StatusChip';

export default function HolderPayoutsPage() {
  const { db, currentUser, openAuthModal, markPayoutPaid } = useWhap();

  const [payingRequestId, setPayingRequestId] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('GCASH-REF-8849201');
  const [receiptUrl, setReceiptUrl] = useState(
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80'
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <button
          type="button"
          onClick={() => openAuthModal('/holder/payouts')}
          className="rounded-xl bg-tally px-4 py-2 text-xs font-bold text-zinc-950"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleMarkPaid = (e: React.FormEvent, requestId: string) => {
    e.preventDefault();
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const paid = markPayoutPaid({
        payout_request_id: requestId,
        reference_number: referenceNumber,
        receipt_url: receiptUrl,
      });
      setPayingRequestId(null);
      setToastMsg(
        `Marked payout ${paid.id} (${formatMoneyCents(
          paid.amount_cents,
          paid.currency
        )}) as PAID with reference ${paid.reference_number}! Editor ledger updated.`
      );
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
          Account Holder Settlement Desk
        </span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
          Editor Payout Requests
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Settle pending editor payout requests and record your transaction reference number and optional receipt image.
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

      <div className="space-y-3">
        {db.payout_requests.map((req) => {
          const editor = db.profiles.find((p) => p.id === req.editor_id);
          const camp = db.campaigns.find((c) => c.id === req.campaign_id);

          return (
            <div
              key={req.id}
              className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-extrabold text-white">
                      {formatMoneyCents(req.amount_cents, req.currency)}
                    </span>
                    <PayoutStatusChip status={req.status} />
                  </div>
                  <p className="text-xs text-zinc-300">
                    Editor: <span className="font-bold text-white">@{editor?.username}</span> (
                    {editor?.display_name}) · Send to:{' '}
                    <span className="font-mono text-tally-bright">
                      {req.payout_method_summary}
                    </span>
                  </p>
                  {camp && (
                    <p className="text-[11px] text-zinc-400">Campaign: {camp.title}</p>
                  )}
                </div>

                {req.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPayingRequestId(payingRequestId === req.id ? null : req.id)
                    }
                    className="rounded-xl bg-tally px-4 py-2.5 text-xs font-extrabold text-zinc-950 hover:bg-tally-bright"
                  >
                    Mark Payout Paid
                  </button>
                ) : (
                  <div className="text-right text-xs">
                    <p className="font-mono text-emerald-300">Ref: {req.reference_number}</p>
                    {req.receipt_url && (
                      <a
                        href={req.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-tally-bright hover:underline"
                      >
                        View Receipt <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {payingRequestId === req.id && (
                <form
                  onSubmit={(e) => handleMarkPaid(e, req.id)}
                  className="rounded-xl border border-tally/40 bg-elevated p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300">
                        Transaction Reference Number (Required)
                      </label>
                      <input
                        type="text"
                        required
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. GCASH-99812345 or PP-TXN-..."
                        className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300">
                        Receipt Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={receiptUrl}
                        onChange={(e) => setReceiptUrl(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-inset px-3 py-2 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-tally px-4 py-2 text-xs font-extrabold text-zinc-950"
                  >
                    Confirm Payment &amp; Update Ledger
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
