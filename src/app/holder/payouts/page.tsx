'use client';

import React, { useState } from 'react';
import { CheckCircle, Coins, WarningCircle } from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { PayoutStatusChip } from '@/components/StatusChip';
import { ConfettiBurst } from '@/components/ClappyMascot';

export default function HolderPayoutsPage() {
  const { db, markPayoutPaid } = useWhap();

  const [refNumberMap, setRefNumberMap] = useState<Record<string, string>>({});
  const [receiptUrlMap, setReceiptUrlMap] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paidConfettiId, setPaidConfettiId] = useState<string | null>(null);

  const handleMarkPaid = (payoutId: string) => {
    setErrorMsg(null);
    setToastMsg(null);
    try {
      const reference_number =
        refNumberMap[payoutId] || 'GCASH-REF-2026-994120';
      const receipt_image_url =
        receiptUrlMap[payoutId] ||
        'https://storage.whap.app/receipts/payout-receipt.png';

      markPayoutPaid({
        payout_id: payoutId,
        reference_number,
        receipt_image_url,
      });

      setPaidConfettiId(payoutId);
      setToastMsg(
        `Payout marked paid (Ref: ${reference_number}). Editor ledger updated.`
      );
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Editor Payout Requests
        </h1>
        <p className="mt-1 text-sm text-muted">
          Send payment to the editor&apos;s saved payout method, then enter the
          reference number and optional receipt image.
        </p>
      </div>

      {toastMsg && (
        <div className="flex items-center gap-2.5 rounded-btn border-2 border-ink bg-sprout p-4 text-sm font-extrabold text-ink shadow-btn">
          <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
          <span>{toastMsg}</span>
          <ConfettiBurst active={Boolean(paidConfettiId)} />
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-btn border-2 border-ink bg-coral p-4 text-sm font-extrabold text-ink shadow-btn">
          <WarningCircle weight="bold" className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {db.payout_requests.map((pr) => {
          const editor = db.profiles.find((p) => p.id === pr.editor_id);
          return (
            <div key={pr.id} className="card-sticker p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3">
                <div>
                  <span className="text-xs font-extrabold uppercase text-forest">
                    Editor: {editor?.display_name} (@{editor?.username})
                  </span>
                  <p className="font-display text-3xl text-ink tabular-nums">
                    {formatMoneyCents(pr.amount_cents, pr.currency)}
                  </p>
                </div>
                <PayoutStatusChip status={pr.status} />
              </div>

              <div className="rounded-btn border-2 border-ink bg-mint p-3.5 text-xs space-y-1">
                <span className="font-extrabold uppercase text-ink">
                  Send to ({pr.payout_method_type.toUpperCase()}):
                </span>
                <p className="font-bold text-ink tabular-nums">
                  {pr.payout_method_summary}
                </p>
              </div>

              {(pr.status === 'pending' || pr.status === 'requested') ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label
                      htmlFor={`ref-num-${pr.id}`}
                      className="mb-1 block text-xs font-extrabold text-ink"
                    >
                      Reference number
                    </label>
                    <input
                      id={`ref-num-${pr.id}`}
                      type="text"
                      value={refNumberMap[pr.id] ?? 'GCASH-REF-2026-994120'}
                      onChange={(e) =>
                        setRefNumberMap((prev) => ({
                          ...prev,
                          [pr.id]: e.target.value,
                        }))
                      }
                      className="input-sticker tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`receipt-url-${pr.id}`}
                      className="mb-1 block text-xs font-extrabold text-ink"
                    >
                      Receipt image URL (optional)
                    </label>
                    <input
                      id={`receipt-url-${pr.id}`}
                      type="url"
                      value={
                        receiptUrlMap[pr.id] ??
                        'https://storage.whap.app/receipts/payout-receipt.png'
                      }
                      onChange={(e) =>
                        setReceiptUrlMap((prev) => ({
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
                      <span>Mark Payout Paid</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-forest tabular-nums">
                  <span>Reference: {pr.reference_number}</span>
                  {pr.receipt_url && (
                    <a
                      href={pr.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-extrabold"
                    >
                      View Receipt Image
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
